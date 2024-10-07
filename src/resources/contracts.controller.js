import { handleErrorResponse } from "../utils/ErrorHandling.js";
import {
  filteredContractRequestsQueue1,
  filteredContractRequestsQueue2,
  filteredContractRequestsQueue3,
} from "../utils/Queues.js";
import { contractRequestWorker } from "../Workers/FilteredContractsWorker.js";

let counter = 0;

export const getFilteredContractsBuffer = async (req, res) => {
  try {
    const jobData = req.body;
    const queues = [
      filteredContractRequestsQueue1,
      filteredContractRequestsQueue2,
      filteredContractRequestsQueue3,
    ];
    const filteredContractRequestsQueue = queues[counter % queues.length]; // Round-robin selection
    counter++;
    await filteredContractRequestsQueue.add("All Contracts", jobData);
    return res.json({ message: "Contract request queued" });
  } catch (error) {
    handleErrorResponse(error, res);
  }
};
