import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Credit } from '../entities/credit.entity';
import { CreditPayment } from '../entities/credit-payment.entity';

@Injectable()
export class CreditPdfService {
  /**
   * Generate a professional PDF receipt for a credit payment
   */
  async generatePaymentReceipt(
    credit: Credit,
    payment: CreditPayment,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('PAYMENT RECEIPT', { align: 'center' })
          .moveDown(0.5);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Receipt No: ${payment.paymentNumber}`, { align: 'center' })
          .text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, {
            align: 'center',
          })
          .moveDown(2);

        // Customer Information
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Customer Information')
          .moveDown(0.3);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Name: ${credit.customer?.name || 'N/A'}`)
          .text(`Phone: ${credit.customer?.phoneNumber || 'N/A'}`)
          .moveDown(1);

        // Credit Information
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Credit Information')
          .moveDown(0.3);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Credit Number: ${credit.creditNumber}`)
          .text(`Credit Type: ${credit.type}`)
          .text(`Original Amount: $${Number(credit.principalAmount).toFixed(2)}`)
          .text(`Issue Date: ${new Date(credit.issueDate).toLocaleDateString()}`)
          .text(`Due Date: ${new Date(credit.dueDate).toLocaleDateString()}`)
          .moveDown(1);

        // Payment Details
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Payment Details')
          .moveDown(0.3);

        const startY = doc.y;
        
        // Create a table-like structure
        doc
          .fontSize(10)
          .font('Helvetica')
          .text('Description', 50, startY, { width: 200 })
          .text('Amount', 300, startY, { width: 100, align: 'right' });

        doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();

        let currentY = startY + 25;
        
        doc
          .text('Principal Amount', 50, currentY, { width: 200 })
          .text(`$${Number(payment.principalAmount).toFixed(2)}`, 300, currentY, {
            width: 100,
            align: 'right',
          });
        currentY += 20;

        if (Number(payment.interestAmount) > 0) {
          doc
            .text('Interest Amount', 50, currentY, { width: 200 })
            .text(`$${Number(payment.interestAmount).toFixed(2)}`, 300, currentY, {
              width: 100,
              align: 'right',
            });
          currentY += 20;
        }

        if (Number(payment.feesAmount) > 0) {
          doc
            .text('Fees Amount', 50, currentY, { width: 200 })
            .text(`$${Number(payment.feesAmount).toFixed(2)}`, 300, currentY, {
              width: 100,
              align: 'right',
            });
          currentY += 20;
        }

        doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
        currentY += 10;

        doc
          .font('Helvetica-Bold')
          .text('Total Payment', 50, currentY, { width: 200 })
          .text(`$${Number(payment.amount).toFixed(2)}`, 300, currentY, {
            width: 100,
            align: 'right',
          });

        currentY += 30;
        doc.y = currentY;

        // Payment Method
        doc
          .font('Helvetica')
          .text(`Payment Method: ${payment.paymentMethod}`, 50, currentY);
        
        if (payment.transactionReference) {
          currentY += 20;
          doc.text(
            `Transaction Reference: ${payment.transactionReference}`,
            50,
            currentY,
          );
        }

        if (payment.notes) {
          currentY += 20;
          doc.text(`Notes: ${payment.notes}`, 50, currentY);
        }

        currentY += 40;
        doc.y = currentY;

        // Balance Information
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Balance Information')
          .moveDown(0.3);

        const totalCreditAmount = Number(credit.principalAmount);
        const paidAmount = Number(credit.paidAmount);
        const remainingBalance = Number(credit.remainingBalance);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Total Credit Amount: $${totalCreditAmount.toFixed(2)}`)
          .text(`Total Paid: $${paidAmount.toFixed(2)}`)
          .font('Helvetica-Bold')
          .text(`Remaining Balance: $${remainingBalance.toFixed(2)}`)
          .moveDown(2);

        // Footer
        doc
          .fontSize(9)
          .font('Helvetica')
          .text('Thank you for your payment!', { align: 'center' })
          .moveDown(0.5)
          .fontSize(8)
          .text(
            'This is a computer-generated receipt and does not require a signature.',
            { align: 'center' },
          );

        // Processed by
        if (payment.processedBy) {
          doc
            .moveDown(2)
            .fontSize(8)
            .text(
              `Processed by: ${payment.processedBy.firstName} ${payment.processedBy.lastName}`,
              { align: 'left' },
            )
            .text(
              `Generated on: ${new Date().toLocaleString()}`,
              { align: 'left' },
            );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate a PDF statement for a credit showing all transactions
   */
  async generateCreditStatement(credit: Credit): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('CREDIT STATEMENT', { align: 'center' })
          .moveDown(0.5);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Credit No: ${credit.creditNumber}`, { align: 'center' })
          .text(`Statement Date: ${new Date().toLocaleDateString()}`, {
            align: 'center',
          })
          .moveDown(2);

        // Customer Information
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Customer Information')
          .moveDown(0.3);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Name: ${credit.customer?.name || 'N/A'}`)
          .text(`Phone: ${credit.customer?.phoneNumber || 'N/A'}`)
          .moveDown(1);

        // Credit Summary
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Credit Summary')
          .moveDown(0.3);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Credit Type: ${credit.type}`)
          .text(`Status: ${credit.status}`)
          .text(`Original Amount: $${Number(credit.principalAmount).toFixed(2)}`)
          .text(`Issue Date: ${new Date(credit.issueDate).toLocaleDateString()}`)
          .text(`Due Date: ${new Date(credit.dueDate).toLocaleDateString()}`)
          .text(`Total Paid: $${Number(credit.paidAmount).toFixed(2)}`)
          .font('Helvetica-Bold')
          .text(
            `Remaining Balance: $${Number(credit.remainingBalance).toFixed(2)}`,
          )
          .moveDown(2);

        // Payment History
        if (credit.payments && credit.payments.length > 0) {
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Payment History')
            .moveDown(0.5);

          const tableTop = doc.y;
          const dateCol = 50;
          const refCol = 150;
          const amountCol = 300;
          const balanceCol = 400;

          doc
            .fontSize(9)
            .font('Helvetica-Bold')
            .text('Date', dateCol, tableTop)
            .text('Reference', refCol, tableTop)
            .text('Amount', amountCol, tableTop)
            .text('Balance', balanceCol, tableTop);

          doc
            .moveTo(dateCol, tableTop + 15)
            .lineTo(500, tableTop + 15)
            .stroke();

          let currentY = tableTop + 25;

          credit.payments
            .sort(
              (a, b) =>
                new Date(a.paymentDate).getTime() -
                new Date(b.paymentDate).getTime(),
            )
            .forEach((payment) => {
              doc
                .fontSize(9)
                .font('Helvetica')
                .text(
                  new Date(payment.paymentDate).toLocaleDateString(),
                  dateCol,
                  currentY,
                )
                .text(payment.paymentNumber, refCol, currentY)
                .text(`$${Number(payment.amount).toFixed(2)}`, amountCol, currentY)
                .text(
                  `$${(Number(credit.remainingBalance) + Number(credit.paidAmount) - Number(payment.amount)).toFixed(2)}`,
                  balanceCol,
                  currentY,
                );

              currentY += 20;

              if (currentY > 700) {
                doc.addPage();
                currentY = 50;
              }
            });
        }

        // Footer
        doc
          .moveDown(2)
          .fontSize(8)
          .font('Helvetica')
          .text(
            'This is a computer-generated statement and does not require a signature.',
            { align: 'center' },
          )
          .moveDown(0.5)
          .text(`Generated on: ${new Date().toLocaleString()}`, {
            align: 'center',
          });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

