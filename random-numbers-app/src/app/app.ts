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
      const decimalPlaces = this.normalizeInteger(this.decimalPlaces, 0, 10, 'Digits after decimal');
      const count = this.normalizeInteger(this.randomCount, 1, 1000, 'Number of random values');
      const min = Number(this.minRange);
      const max = Number(this.maxRange);

      if (Number.isNaN(target) || Number.isNaN(min) || Number.isNaN(max)) {
        throw new Error('Please fill in all numeric fields.');
      }

      if (max <= min) {
        throw new Error('The maximum range must be greater than the minimum range.');
      }

      const result = this.buildAverageNumbers(target, count, min, max, decimalPlaces);
      this.generatedNumbers = result;
      this.averageValue = result.reduce((sum, value) => sum + value, 0) / result.length;
      this.message = `Average: ${this.formatNumber(this.averageValue, decimalPlaces)}.`;
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Unable to generate valid numbers.';
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
          `The average ${this.formatNumber(targetAverage, decimalPlaces)} is outside the range [${this.formatNumber(min, decimalPlaces)}, ${this.formatNumber(max, decimalPlaces)}].`,
        );
      }

      return [Number(targetAverage.toFixed(decimalPlaces))];
    }

    if (requiredTotal < minScaled * count || requiredTotal > maxScaled * count) {
      throw new Error(
        `The average ${this.formatNumber(targetAverage, decimalPlaces)} is impossible for the range [${this.formatNumber(min, decimalPlaces)}, ${this.formatNumber(max, decimalPlaces)}].`,
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

    throw new Error('Could not generate a valid set of numbers for the selected parameters.');
  }

  private normalizeInteger(value: number, min: number, max: number, label: string): number {
    const parsed = Number(value);
    const integerValue = Math.trunc(parsed);
    if (!Number.isFinite(integerValue) || integerValue < min || integerValue > max) {
      throw new Error(`${label} must be a whole number between ${min} and ${max}.`);
    }

    return integerValue;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private clampValue(value: number, min: number, max: number, decimalPlaces: number): number {
    const clamped = Math.min(Math.max(value, min), max);
    return Number(clamped.toFixed(decimalPlaces));
  }

  private formatNumber(value: number, decimalPlaces: number): string {
    return Number(value).toFixed(decimalPlaces);
  }
}
