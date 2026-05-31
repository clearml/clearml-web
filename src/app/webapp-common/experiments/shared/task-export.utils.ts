export interface TaskExportData {
  exported_at: string;
  task: any;
  execution?: any;
  configuration?: any;
  dataviews?: any;
  models?: any;
}

export function buildTaskExportData(task: any): TaskExportData {
  const exportData: TaskExportData = {
    exported_at: new Date().toISOString(),
    task: task,
  };

  // Remove undefined/null top-level fields for cleaner JSON
  Object.keys(exportData).forEach(key => {
    if (exportData[key] === undefined || exportData[key] === null) {
      delete exportData[key];
    }
  });

  return exportData;
}

export function generateTaskExportFilename(taskId: string): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `task_${taskId}_${date}`;
}
