/**
 * Каталог заданий — тот же файл content/lessons.json, из которого сервер
 * заполняет таблицу tasks. Приложению из него нужны только id и версии:
 * какие решения ребёнка оцениваются и какой версии задания они относятся.
 */
import catalog from '../../content/lessons.json';

type CatalogShape = { lessons: { id: string; tasks: { id: string; version: number }[] }[] };

const versions = new Map<string, number>();
for (const lesson of (catalog as CatalogShape).lessons) {
  for (const task of lesson.tasks) versions.set(task.id, task.version);
}

/** Версия задания или undefined, если такое решение не оценивается. */
export function taskVersion(taskId: string): number | undefined {
  return versions.get(taskId);
}
