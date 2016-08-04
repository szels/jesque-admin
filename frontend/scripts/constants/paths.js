import LinkInfo from "../tools/path-info";

export const JOB_LIST = new LinkInfo('/jobs', 'jobsList', 'List');
export const JOB_FAILED = new LinkInfo('/jobs/failed/1', 'jobsFailed', 'Failed');
export const JOB_ENQUEUE = new LinkInfo('/jobs/enqueue', 'jobsEnqueue', 'Enqueue');
export const JOB_SCHEDULED = new LinkInfo('/jobs/scheduled', 'jobsScheduled', 'Scheduled');
export const JOB_DELAYED = new LinkInfo('/jobs/delayed', 'jobsDelayed', 'Delayed');
export const WORKER_LIST = new LinkInfo('/workers', 'workersList', 'List');
export const WORKER_START = new LinkInfo('/workers/start', 'workersStart', 'Start');
export const QUEUE_LIST = new LinkInfo('/queues', 'queuesList', 'Queues');
export const HOME = new LinkInfo('/', 'home', 'Home');

export const JOB_LINKS = [
  JOB_LIST,
  JOB_FAILED,
  JOB_ENQUEUE,
  JOB_SCHEDULED,
  JOB_DELAYED
];

export const WORKERS_LINKS = [
  WORKER_LIST,
  WORKER_START
];