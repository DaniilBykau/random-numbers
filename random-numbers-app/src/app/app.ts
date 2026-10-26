import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  targetAverage = 10;
  decimalPlaces = 2;
  randomCount = 5;
  maxSpread = 20;
  generatedNumbers: number[] = [];
  averageValue = 0;
  message = '';

  generateNumbers(): void {
    this.message = '';
    this.generatedNumbers = [];
    this.averageValue = 0;

    try {
      const target = Number(this.targetAverage);
      const decimalPlaces = this.normalizeInteger(this.decimalPlaces, 0, 10, 'Liczba miejsc po przecinku');
      const count = this.normalizeInteger(this.randomCount, 1, 1000, 'Liczba losowanych wartości');
      const maxSpread = Number(this.maxSpread);

      if (!Number.isFinite(target) || !Number.isFinite(maxSpread)) {
        throw new Error('Uzupełnij wszystkie pola wartościami liczbowymi.');
      }

      if (maxSpread < 0) {
        throw new Error('Maksymalna różnica nie może być ujemna.');
      }

      const result = this.buildAverageNumbers(target, count, maxSpread, decimalPlaces);
      this.generatedNumbers = result;
      this.averageValue = result.reduce((sum, value) => sum + value, 0) / result.length;
      this.message = `Średnia: ${this.formatNumber(this.averageValue, decimalPlaces)}.`;
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Nie udało się wygenerować poprawnych liczb.';
    }
  }

  private buildAverageNumbers(
    targetAverage: number,
    count: number,
    maxSpread: number,
    decimalPlaces: number,
  ): number[] {
    const factor = 10 ** decimalPlaces;
    const targetScaled = Math.round(targetAverage * factor);
    const spreadScaled = Math.floor(maxSpread * factor);

    if (!Number.isSafeInteger(targetScaled) || !Number.isSafeInteger(spreadScaled)) {
      throw new Error('Podane wartości są zbyt duże dla wybranej dokładności.');
    }

    const maxOffset = Math.floor(spreadScaled / 2);
    if (!Number.isSafeInteger(targetScaled - maxOffset) || !Number.isSafeInteger(targetScaled + maxOffset)) {
      throw new Error('Podane wartości są zbyt duże dla wybranej dokładności.');
    }

    const valuesScaled: number[] = [];
    if (count % 2 === 1) {
      valuesScaled.push(targetScaled);
    }

    for (let pair = 0; pair < Math.floor(count / 2); pair++) {
      const offset = this.randomInt(0, maxOffset);
      valuesScaled.push(targetScaled - offset, targetScaled + offset);
    }

    for (let index = valuesScaled.length - 1; index > 0; index--) {
      const swapIndex = this.randomInt(0, index);
      [valuesScaled[index], valuesScaled[swapIndex]] = [valuesScaled[swapIndex], valuesScaled[index]];
    }

    return valuesScaled.map((value) => value / factor);
  }

  private normalizeInteger(value: number, min: number, max: number, label: string): number {
    const parsed = Number(value);
    const integerValue = Math.trunc(parsed);
    if (!Number.isFinite(integerValue) || integerValue < min || integerValue > max) {
      throw new Error(`${label} musi być liczbą całkowitą z zakresu od ${min} do ${max}.`);
    }

    return integerValue;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  formatNumber(value: number, decimalPlaces: number): string {
    return Number(value).toLocaleString('pl-PL', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  }
}
