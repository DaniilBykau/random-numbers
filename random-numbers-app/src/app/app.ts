import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface GenerationRecord {
  id: string;
  createdAt: string;
  targetAverage: string;
  decimalPlaces: number;
  randomCount: number;
  maxSpread: string;
  numbers: string[];
}

const HISTORY_STORAGE_KEY = 'random-numbers-history';
const HISTORY_LIMIT = 20;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  targetAverage = '10';
  decimalPlaces = 2;
  randomCount = 5;
  maxSpread = '20';
  generatedNumbers: string[] = [];
  averageValue = '';
  message = '';
  historyMessage = '';
  history: GenerationRecord[] = [];

  constructor() {
    this.loadHistory();
  }

  generateNumbers(): void {
    this.message = '';
    this.generatedNumbers = [];
    this.averageValue = '';

    try {
      const decimalPlaces = this.normalizeInteger(this.decimalPlaces, 0, 20, 'Liczba miejsc po przecinku');
      const count = this.normalizeInteger(this.randomCount, 1, 1000, 'Liczba losowanych wartości');
      const target = this.parseScaledDecimal(this.targetAverage, decimalPlaces, true);
      const maxSpread = this.parseScaledDecimal(this.maxSpread, decimalPlaces, false);

      if (maxSpread < 0n) {
        throw new Error('Maksymalna różnica nie może być ujemna.');
      }

      const numbers = this.buildAverageNumbers(target, count, maxSpread);
      this.generatedNumbers = numbers.map(String);
      this.averageValue = String(target);
      this.message = `Średnia: ${this.formatScaled(this.averageValue, decimalPlaces)}.`;
      if (count > 1 && numbers.includes(target)) {
        this.message += ' Przy tak małej maksymalnej różnicy co najmniej jedna liczba musi być równa średniej.';
      }
      this.saveGeneration({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
        targetAverage: String(target),
        decimalPlaces,
        randomCount: count,
        maxSpread: String(maxSpread),
        numbers: this.generatedNumbers,
      });
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Nie udało się wygenerować poprawnych liczb.';
    }
  }

  clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      this.history = [];
      this.historyMessage = '';
    } catch {
      this.historyMessage = 'Nie udało się wyczyścić historii w pamięci przeglądarki.';
    }
  }

  formatScaled(value: string, decimalPlaces: number): string {
    const scaledValue = BigInt(value);
    const isNegative = scaledValue < 0n;
    const absoluteValue = isNegative ? -scaledValue : scaledValue;
    const factor = 10n ** BigInt(decimalPlaces);
    const integerPart = absoluteValue / factor;
    const fractionPart = absoluteValue % factor;
    const formattedInteger = new Intl.NumberFormat('pl-PL').format(integerPart);
    const sign = isNegative ? '-' : '';

    if (decimalPlaces === 0) {
      return `${sign}${formattedInteger}`;
    }

    return `${sign}${formattedInteger},${fractionPart.toString().padStart(decimalPlaces, '0')}`;
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('pl-PL');
  }

  private buildAverageNumbers(target: bigint, count: number, maxSpread: bigint): bigint[] {
    if (count === 1) {
      return [target];
    }

    const offsets: bigint[] = [];
    if (count % 2 === 1) {
      const maxTripleOffset = maxSpread / 3n;
      if (maxTripleOffset > 0n) {
        const firstOffset = this.randomBigInt(maxTripleOffset - 1n) + 1n;
        const secondOffset = this.randomBigInt(maxTripleOffset - 1n) + 1n;
        const direction = this.randomInt(2) === 0 ? 1n : -1n;
        offsets.push(
          firstOffset * direction,
          secondOffset * direction,
          -(firstOffset + secondOffset) * direction,
        );
      } else {
        offsets.push(0n);
      }
    }

    const lowestOffset = offsets.reduce((lowest, offset) => offset < lowest ? offset : lowest, 0n);
    const highestOffset = offsets.reduce((highest, offset) => offset > highest ? offset : highest, 0n);
    const maxPairOffset = [
      maxSpread / 2n,
      maxSpread + lowestOffset,
      maxSpread - highestOffset,
    ].reduce((smallest, offset) => offset < smallest ? offset : smallest);
    const pairCount = (count - offsets.length) / 2;

    for (let pair = 0; pair < pairCount; pair++) {
      const offset = maxPairOffset > 0n ? this.randomBigInt(maxPairOffset - 1n) + 1n : 0n;
      offsets.push(-offset, offset);
    }

    const values = offsets.map((offset) => target + offset);
    for (let index = values.length - 1; index > 0; index--) {
      const swapIndex = this.randomInt(index + 1);
      [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
    }

    return values;
  }

  private parseScaledDecimal(value: string, decimalPlaces: number, round: boolean): bigint {
    const normalized = value.trim().replace(',', '.');
    const match = /^([+-]?)(\d+)(?:\.(\d*))?$/.exec(normalized);
    if (!match || match[2].length > 100) {
      throw new Error('Wpisz poprawną liczbę (maksymalnie 100 cyfr przed przecinkiem).');
    }

    const isNegative = match[1] === '-';
    const wholePart = BigInt(match[2]);
    const fraction = match[3] ?? '';
    const keptFraction = fraction.slice(0, decimalPlaces).padEnd(decimalPlaces, '0');
    const factor = 10n ** BigInt(decimalPlaces);
    let scaledValue = wholePart * factor + BigInt(keptFraction || '0');

    if (round && fraction.length > decimalPlaces && fraction[decimalPlaces] >= '5') {
      scaledValue += 1n;
    }

    return isNegative ? -scaledValue : scaledValue;
  }

  private normalizeInteger(value: number, min: number, max: number, label: string): number {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new Error(`${label} musi być liczbą całkowitą z zakresu od ${min} do ${max}.`);
    }

    return value;
  }

  private randomBigInt(max: bigint): bigint {
    if (max <= 0n) {
      return 0n;
    }

    const bitLength = max.toString(2).length;
    const byteLength = Math.ceil(bitLength / 8);
    const mask = (1n << BigInt(bitLength)) - 1n;
    const bytes = new Uint8Array(byteLength);

    for (;;) {
      globalThis.crypto.getRandomValues(bytes);
      let candidate = 0n;
      for (const byte of bytes) {
        candidate = (candidate << 8n) | BigInt(byte);
      }

      candidate &= mask;
      if (candidate <= max) {
        return candidate;
      }
    }
  }

  private randomInt(max: number): number {
    return Math.floor(Math.random() * max);
  }

  private loadHistory(): void {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!storedHistory) {
        return;
      }

      const parsed: unknown = JSON.parse(storedHistory);
      if (!Array.isArray(parsed) || !parsed.every((item) => this.isGenerationRecord(item))) {
        throw new Error('Nieprawidłowy format historii.');
      }

      this.history = parsed.slice(0, HISTORY_LIMIT);
    } catch {
      this.historyMessage = 'Nie udało się odczytać zapisanej historii operacji.';
    }
  }

  private saveGeneration(record: GenerationRecord): void {
    const nextHistory = [record, ...this.history].slice(0, HISTORY_LIMIT);

    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
      this.history = nextHistory;
      this.historyMessage = '';
    } catch {
      this.history = nextHistory;
      this.historyMessage = 'Wyniki wygenerowano, ale nie udało się zapisać historii w pamięci przeglądarki.';
    }
  }

  private isGenerationRecord(value: unknown): value is GenerationRecord {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const record = value as Partial<GenerationRecord>;
    const decimalPlaces = record.decimalPlaces;
    const randomCount = record.randomCount;
    return (
      typeof record.id === 'string' &&
      typeof record.createdAt === 'string' &&
      Number.isFinite(Date.parse(record.createdAt)) &&
      typeof record.targetAverage === 'string' &&
      /^-?\d+$/.test(record.targetAverage) &&
      typeof decimalPlaces === 'number' &&
      Number.isInteger(decimalPlaces) &&
      decimalPlaces >= 0 &&
      decimalPlaces <= 20 &&
      typeof randomCount === 'number' &&
      Number.isInteger(randomCount) &&
      randomCount >= 1 &&
      randomCount <= 1000 &&
      typeof record.maxSpread === 'string' &&
      /^\d+$/.test(record.maxSpread) &&
      Array.isArray(record.numbers) &&
      record.numbers.length === randomCount &&
      record.numbers.every((number) => typeof number === 'string' && /^-?\d+$/.test(number))
    );
  }
}
