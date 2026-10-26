import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the Polish title and form labels', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Generuj liczby o zadanej średniej');
    expect(compiled.textContent).toContain('Wartość średniej');
    expect(compiled.textContent).toContain('Maksymalna różnica między liczbami');
    expect(compiled.textContent).toContain('Rzeczywista różnica może być mniejsza.');
    expect(compiled.textContent).toContain('Generuj liczby');
  });

  it('should generate values with the target average and no more than the requested spread', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.targetAverage = 10;
    app.randomCount = 8;
    app.maxSpread = 6;

    app.generateNumbers();

    const actualAverage = app.generatedNumbers.reduce((sum, value) => sum + value, 0) / app.generatedNumbers.length;
    const actualSpread = Math.max(...app.generatedNumbers) - Math.min(...app.generatedNumbers);
    expect(app.generatedNumbers).toHaveLength(8);
    expect(actualAverage).toBeCloseTo(10, 10);
    expect(actualSpread).toBeLessThanOrEqual(6);
  });

  it('should allow a zero maximum spread', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.targetAverage = 4.25;
    app.randomCount = 3;
    app.maxSpread = 0;

    app.generateNumbers();

    expect(app.generatedNumbers).toEqual([4.25, 4.25, 4.25]);
  });
});
