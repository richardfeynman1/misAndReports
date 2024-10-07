import { Queue } from "bullmq";
import { queueOptions } from "../config/bullMQ";

export const filteredContractRequestsQueue1 = new Queue(
  "FilteredContractRequests1",
  { queueOptions, stalledInterval: 60000 }
);
export const filteredContractRequestsQueue2 = new Queue(
  "FilteredContractRequests2",
  { queueOptions, stalledInterval: 60000 }
);
export const filteredContractRequestsQueue3 = new Queue(
  "FilteredContractRequests3",
  { queueOptions, stalledInterval: 60000 }
);
