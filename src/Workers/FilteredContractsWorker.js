import { Worker } from "bullmq";
import { connectionOptions } from "../config/bullMQ";
import { FilterContracts } from "../processManager/FilterContracts";
import { db } from "../config/db";
import {
  filteredContractRequestsQueue1,
  filteredContractRequestsQueue2,
  filteredContractRequestsQueue3,
} from "../utils/Queues";

const processJob = async (job) => {
  console.log(`Processing job ---> ${job.id}`);
  const { type, data } = job.data;
  switch (type) {
    case "EXCEL_BUFFER_CREATION":
      await FilterContracts(data);
      break;

    default:
      console.error(`Unknown job type: ${type}`);
  }
};

export const contractRequestWorker = [
  filteredContractRequestsQueue1,
  filteredContractRequestsQueue2,
  filteredContractRequestsQueue3,
].map(
  (queue) =>
    new Worker(
      queue.name,
      async (job) => {
        await processJob(job);
      },
      { connection: connectionOptions }
    )
);

contractRequestWorker.forEach((worker) => {
  worker.on("completed", async (job) => {
    console.log(`Job ${job.id} has completed!`);
  });

  worker.on("failed", (job, err) => {
    console.log(`Job ${job.id} has failed with ${err.message}`);
  });
});
