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
  minRange = 0;
  maxRange = 20;
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
      const min = Number(this.minRange);
      const max = Number(this.maxRange);

      if (Number.isNaN(target) || Number.isNaN(min) || Number.isNaN(max)) {
        throw new Error('Uzupełnij wszystkie pola wartościami liczbowymi.');
      }

      if (max <= min) {
        throw new Error('Górna granica zakresu musi być większa od dolnej.');
      }

      const result = this.buildAverageNumbers(target, count, min, max, decimalPlaces);
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
    min: number,
    max: number,
    decimalPlaces: number,
  ): number[] {
    const factor = 10 ** decimalPlaces;
    const minScaled = Math.round(min * factor);
    const maxScaled = Math.round(max * factor);
    const targetScaled = Math.round(targetAverage * factor);
    const requiredTotal = targetScaled * count;

    if (count === 1) {
      if (targetAverage < min || targetAverage > max) {
        throw new Error(
          `Średnia ${this.formatNumber(targetAverage, decimalPlaces)} wykracza poza zakres [${this.formatNumber(min, decimalPlaces)}, ${this.formatNumber(max, decimalPlaces)}].`,
        );
      }

      return [Number(targetAverage.toFixed(decimalPlaces))];
    }

    if (requiredTotal < minScaled * count || requiredTotal > maxScaled * count) {
      throw new Error(
        `Nie można uzyskać średniej ${this.formatNumber(targetAverage, decimalPlaces)} w zakresie [${this.formatNumber(min, decimalPlaces)}, ${this.formatNumber(max, decimalPlaces)}].`,
      );
    }

    for (let attempt = 0; attempt < 2000; attempt++) {
      const valuesScaled: number[] = [];
      let sumScaled = 0;

      for (let index = 0; index < count - 1; index++) {
        const valueScaled = this.randomInt(minScaled, maxScaled);
        valuesScaled.push(valueScaled);
        sumScaled += valueScaled;
      }

      const lastValueScaled = requiredTotal - sumScaled;
      if (lastValueScaled >= minScaled && lastValueScaled <= maxScaled) {
        valuesScaled.push(lastValueScaled);
        return valuesScaled.map((value) => value / factor);
      }
    }

    throw new Error('Nie udało się wygenerować zestawu liczb dla wybranych parametrów.');
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
