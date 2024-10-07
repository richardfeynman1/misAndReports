import { ObjectId } from "mongodb";
import { db } from "../config/db";
import { parsePayloadToMongoDBPipeline } from "../utils/FilterPipelineParser/PipelineCreationFromPayload";
import { generateExcelBuffer } from "../utils/GenerateExcelBuffer";
import { getSortingKeyPipeline } from "../utils/FilterPipelineParser/GetSortingQuery";
import axios from "axios";
import { sendRequestToCMTBackend } from "../utils/sendRequestToCMTBackend";
import { jwtGeneratorToSendRequestToCMT } from "../utils/createJwt";

const populatedPipeline = [
  {
    $lookup: {
      from: "users",
      localField: "initiator",
      foreignField: "_id",
      as: "initiator",
      pipeline: [{ $project: { fullName: 1 } }],
    },
  },
  {
    $unwind: {
      path: "$initiator",
      preserveNullAndEmptyArrays: true,
    },
  },

  {
    $lookup: {
      from: "users",
      localField: "participants",
      foreignField: "_id",
      as: "participants",
      pipeline: [{ $project: { fullName: 1 } }],
    },
  },

  {
    $lookup: {
      from: "users",
      localField: "members",
      foreignField: "_id",
      as: "members",
      pipeline: [{ $project: { fullName: 1 } }],
    },
  },

  {
    $lookup: {
      from: "users",
      localField: "signatories.id",
      foreignField: "_id",
      as: "signatories",
      pipeline: [{ $project: { fullName: 1 } }],
    },
  },

  {
    $lookup: {
      from: "users",
      localField: "externalSignatories.id",
      foreignField: "_id",
      as: "externalSignatories",
      pipeline: [{ $project: { fullName: 1 } }],
    },
  },

  {
    $lookup: {
      from: "tags",
      localField: "searchTags",
      foreignField: "_id",
      as: "searchTags",
      pipeline: [{ $project: { name: 1 } }],
    },
  },

  {
    $lookup: {
      from: "userGroup",
      localField: "memberGroups",
      foreignField: "_id",
      as: "memberGroups",
      pipeline: [{ $project: { name: 1 } }],
    },
  },

  {
    $lookup: {
      from: "userGroup",
      localField: "participantGroups",
      foreignField: "_id",
      as: "participantGroups",
      pipeline: [{ $project: { name: 1 } }],
    },
  },

  {
    $project: {
      _id: 1,
      name: 1,
      type: 1,
      status: 1,
      stage: 1,
      priority: 1,
      editorType: 1,
      contractStages: 1,
      contractStatus: 1,
      isDeleted: 1,
      contractTypeMetaFields: 1,
      documentId: 1,
      createdAt: 1,
      updatedAt: 1,
      templateId: 1,
      workflowId: 1,
      templateVersion: 1,
      origin: 1,
      contractFields: 1,
      initiator: "$initiator.fullName",
      members: {
        $map: {
          input: "$members",
          as: "member",
          in: "$$member.fullName",
        },
      },
      participants: {
        $map: {
          input: "$participants",
          as: "participant",
          in: "$$participant.fullName",
        },
      },

      signatories: {
        $map: {
          input: "$signatories",
          as: "signatory",
          in: "$$signatory.fullName",
        },
      },
      externalSignatories: {
        $map: {
          input: "$externalSignatories",
          as: "externalSignatory",
          in: "$$externalSignatory.fullName",
        },
      },

      searchTags: {
        $map: {
          input: "$searchTags",
          as: "tag",
          in: "$$tag.name",
        },
      },

      memberGroups: {
        $map: {
          input: "$memberGroups",
          as: "group",
          in: "$$group.name",
        },
      },
      participantGroups: {
        $map: {
          input: "$participantGroups",
          as: "group",
          in: "$$group.name",
        },
      },
    },
  },
];

export const FilterContracts = async (job) => {
  try {
    const contracts = db.collection("contracts");
    const Users = db.collection("users");
    const allContractTypes = await contracts.distinct("type");

    const userGroupsOfUser = await Users.findOne(
      { _id: new ObjectId(job.userId) },
      { projection: { userGroup: 1 } }
    );

    const commonQuery = {
      orgId: new ObjectId(job.orgId),
      isDeleted: false,
      status: { $ne: "Archived" },
      $or: [
        { initiator: new ObjectId(job.userId) },
        { members: { $in: [new ObjectId(job.userId)] } },
        { participants: { $in: [new ObjectId(job.userId)] } },
        { "signatories.id": { $in: [new ObjectId(job.userId)] } },
        { "approvers.id": { $in: [new ObjectId(job.userId)] } },
        { "preApprovers.id": { $in: [new ObjectId(job.userId)] } },
        { memberGroups: { $in: userGroupsOfUser.userGroup } },
      ],
    };

    const query =
      job.filters && job.filters !== ""
        ? parsePayloadToMongoDBPipeline(job.filters)
        : [];

    const results = await contracts
      .aggregate([
        { $match: commonQuery },
        ...query,
        ...getSortingKeyPipeline(job.sort.sortingKey, job.sort.sortingOrder),
        ...populatedPipeline,
      ])
      .toArray();

    const excelBuffer = await generateExcelBuffer(
      results,
      job.columns,
      allContractTypes,

      { segregate: job.segregate }
    );

    if (excelBuffer) {
      const base64String = excelBuffer.toString("base64");
      const token = jwtGeneratorToSendRequestToCMT(job.orgId, job.userId);
    //   console.log(token, "tokentoken");
      const successcall = await sendRequestToCMTBackend(
        "post",
        job.successCallbackUrl,
        token,
        {
          excelBuffer: base64String,
          fileName: job.fileName,
        }
      );

    //   console.log(successcall.data.data, "datatatatatatatatatatatataat");

      if (successcall.statusCode !== 200) {
        return successcall.data;
      }
      console.log("Success callback sent");
      return excelBuffer;
    } else {
      throw new Error("Failed to generate Excel buffer");
    }
  } catch (error) {
    console.error("Error in FilterContracts:", error);
    try {
      const token = await jwtGeneratorToSendRequestToCMT(job.orgId, job.userId);
      const failureCall = await sendRequestToCMTBackend(
        "post",
        job.failureCallbackUrl,
        token,
        {
          error: error.message,
        }
      );
      console.log("Failure callback sent");
      if (failureCall.statusCode !== 200) {
        return failureCall.data;
      }
    } catch (callbackError) {
      console.error("Error sending failure callback:", callbackError);
    }

    throw error;
  }
};
