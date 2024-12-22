import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { jsPDF } from 'jspdf';

interface AnalysisResult {
  text: string;
  flags: {
    start: number;
    end: number;
    reason: string;
    riskLevel: 'high' | 'medium' | 'low';
  }[];
  summary: {
    riskLevel: 'high' | 'medium' | 'low';
    description: string;
    recommendations: string[];
  };
}

@Component({
  selector: 'ui-analysis-results',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-title>Analysis Results</ion-card-title>
        <ion-card-subtitle>
          Overall Risk Level:
          <ion-badge [color]="getRiskColor(analysis?.summary.riskLevel)">
            {{ analysis?.summary.riskLevel | uppercase }}
          </ion-badge>
        </ion-card-subtitle>
      </ion-card-header>

      <ion-card-content>
        <!-- Risk Summary -->
        <div class="summary-section">
          <h2>Risk Summary</h2>
          <p>{{ analysis?.summary.description }}</p>

          <h3>Key Recommendations</h3>
          <ion-list>
            @for (recommendation of analysis?.summary.recommendations; track recommendation) {
            <ion-item>
              <ion-icon name="warning" slot="start" [color]="getRiskColor(analysis?.summary.riskLevel)"></ion-icon>
              <ion-label>{{ recommendation }}</ion-label>
            </ion-item>
            }
          </ion-list>
        </div>

        <!-- Document Text with Highlights -->
        <div class="document-section">
          <h2>Document Analysis</h2>
          <div class="text-content" [innerHTML]="highlightedText"></div>
        </div>

        <!-- Export Button -->
        <ion-button expand="block" (click)="exportToPDF()" class="export-button">
          <ion-icon name="download-outline" slot="start"></ion-icon>
          Export Report as PDF
        </ion-button>
      </ion-card-content>
    </ion-card>
  `,
  styles: [
    `
      :host {
        display: block;
        margin: 1rem;
      }

      .summary-section {
        margin-bottom: 2rem;
      }

      h2 {
        color: var(--ion-color-dark);
        margin-bottom: 1rem;
      }

      h3 {
        color: var(--ion-color-medium);
        margin: 1rem 0;
      }

      .document-section {
        margin: 2rem 0;
        padding: 1rem;
        background: var(--ion-color-light);
        border-radius: 8px;
      }

      .text-content {
        line-height: 1.6;
        white-space: pre-wrap;
      }

      .highlighted-text {
        background-color: rgba(var(--ion-color-danger-rgb), 0.1);
        border-bottom: 2px solid var(--ion-color-danger);
        cursor: pointer;
      }

      .export-button {
        margin-top: 2rem;
      }

      ion-badge {
        margin-left: 0.5rem;
      }
    `,
  ],
})
export class AnalysisResultsComponent {
  @Input() set analysis(value: AnalysisResult | null) {
    if (value) {
      this._analysis = value;
      this.processText();
    }
  }
  get analysis(): AnalysisResult | null {
    return this._analysis;
  }

  private _analysis: AnalysisResult | null = null;
  highlightedText = '';

  processText() {
    if (!this._analysis) return;

    let text = this._analysis.text;
    let html = '';
    let lastIndex = 0;

    // Sort flags by start position to process them in order
    const sortedFlags = [...this._analysis.flags].sort((a, b) => a.start - b.start);

    for (const flag of sortedFlags) {
      // Add normal text before the flag
      html += this.escapeHtml(text.substring(lastIndex, flag.start));

      // Add highlighted text with tooltip
      const highlightedText = this.escapeHtml(text.substring(flag.start, flag.end));
      html += `<span class="highlighted-text" title="${flag.reason}">${highlightedText}</span>`;

      lastIndex = flag.end;
    }

    // Add any remaining text
    html += this.escapeHtml(text.substring(lastIndex));

    this.highlightedText = html;
  }

  getRiskColor(risk: 'high' | 'medium' | 'low' | undefined): string {
    switch (risk) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'medium';
    }
  }

  exportToPDF() {
    if (!this._analysis) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;

    // Add title
    doc.setFontSize(20);
    doc.text('Document Analysis Report', margin, yPosition);
    yPosition += 15;

    // Add risk level
    doc.setFontSize(14);
    doc.text(`Risk Level: ${this._analysis.summary.riskLevel.toUpperCase()}`, margin, yPosition);
    yPosition += 10;

    // Add summary
    doc.setFontSize(12);
    const summaryLines = doc.splitTextToSize(this._analysis.summary.description, pageWidth - 2 * margin);
    doc.text(summaryLines, margin, yPosition);
    yPosition += summaryLines.length * 7 + 10;

    // Add recommendations
    doc.setFontSize(14);
    doc.text('Recommendations:', margin, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    for (const recommendation of this._analysis.summary.recommendations) {
      const recLines = doc.splitTextToSize(`• ${recommendation}`, pageWidth - 2 * margin);
      doc.text(recLines, margin, yPosition);
      yPosition += recLines.length * 7 + 5;
    }

    // Add flagged content
    yPosition += 10;
    doc.setFontSize(14);
    doc.text('Flagged Content:', margin, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    for (const flag of this._analysis.flags) {
      const flaggedText = this._analysis.text.substring(flag.start, flag.end);
      const flagLines = doc.splitTextToSize(`"${flaggedText}" - ${flag.reason}`, pageWidth - 2 * margin);
      doc.text(flagLines, margin, yPosition);
      yPosition += flagLines.length * 7 + 5;
    }

    // Save the PDF
    doc.save('document-analysis-report.pdf');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
