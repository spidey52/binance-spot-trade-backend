class AsyncQueue {
 private queue: {
  asyncFn: () => Promise<any>;
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
 }[];
 private running: boolean;

 constructor() {
  this.queue = [];
  this.running = false;
 }

 public enqueue(asyncFn: () => Promise<any>): Promise<any> {
  return new Promise((resolve, reject) => {
   this.queue.push({ asyncFn, resolve, reject });
   if (!this.running) {
    this.processQueue();
   }
  });
 }

 private async processQueue(): Promise<void> {
  if (this.queue.length === 0) {
   this.running = false;
   return;
  }

  this.running = true;
  const { asyncFn, resolve, reject } = this.queue.shift()!;

  try {
   const result = await asyncFn();
   resolve(result);
  } catch (error) {
   reject(error);
  }

  this.processQueue();
 }
}

export default AsyncQueue;