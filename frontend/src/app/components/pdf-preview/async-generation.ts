// Отслеживает актуальность async-цепочек, которые могут продолжиться после await.
// Каждая новая операция получает номер поколения и сверяет его перед изменением state/DOM.
export class AsyncGeneration {
  private generation = 0;

  // Начинает новую async-цепочку и возвращает поколение, с которым она должна работать.
  begin(): number {
    return ++this.generation;
  }

  // Делает все ранее выданные поколения устаревшими без запуска новой операции.
  invalidate(): void {
    this.generation++;
  }

  // Возвращает текущее поколение для повторной операции над уже загруженными данными.
  current(): number {
    return this.generation;
  }

  // Проверяет, что async-цепочка относится к старому поколению и не должна менять preview.
  isStale(generation: number): boolean {
    return generation !== this.generation;
  }
}
