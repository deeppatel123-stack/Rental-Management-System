import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const generateInvoicePDF = async (invoice) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const dirPath = path.join(__dirname, '../../public/invoices');

            
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            const fileName = `invoice-${invoice.invoiceNumber}.pdf`;
            const filePath = path.join(dirPath, fileName);
            const writeStream = fs.createWriteStream(filePath);

            doc.pipe(writeStream);

            
            doc.fillColor('#4B5563').fontSize(20).text('RENTAL MANAGEMENT SYSTEM', { align: 'left' });
            doc.fontSize(10).text('Professional Rental Solutions & Logistics', { align: 'left' });
            doc.moveDown();

            
            doc.fillColor('#1F2937').fontSize(14).text(`INVOICE: #${invoice.invoiceNumber}`, { align: 'right' });
            doc.fontSize(10).text(`Issued: ${new Date(invoice.issuedDate).toLocaleDateString()}`, { align: 'right' });
            doc.text(`Type: ${invoice.invoiceType}`, { align: 'right' });
            doc.text(`Status: ${invoice.paymentStatus}`, { align: 'right' });
            doc.moveDown(2);

            
            doc.fillColor('#111827').fontSize(12).text('BILL TO:', { underline: true });
            doc.fontSize(10).text(`Name: ${invoice.customer.name}`);
            doc.text(`Email: ${invoice.customer.email}`);
            doc.moveDown();

            
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#E5E7EB');
            doc.moveDown();

            
            doc.fontSize(12).text('FINANCIAL SUMMARY', { underline: true });
            doc.moveDown();
            doc.fontSize(10);

            doc.text(`Subtotal: $${invoice.subTotal.toFixed(2)}`);
            doc.text(`Tax: $${invoice.taxAmount.toFixed(2)}`);
            if (invoice.lateFees > 0) {
                doc.text(`Late Returns Fee: $${invoice.lateFees.toFixed(2)}`, { fillColor: '#EF4444' });
            }
            if (invoice.repairFees > 0) {
                doc.text(`Repair Assessment Fee: $${invoice.repairFees.toFixed(2)}`, { fillColor: '#EF4444' });
            }
            if (invoice.discountAmount > 0) {
                doc.text(`Discount Applied: -$${invoice.discountAmount.toFixed(2)}`);
            }
            doc.moveDown();
            
            doc.fillColor('#10B981').fontSize(14).text(`Grand Total: $${invoice.totalAmount.toFixed(2)}`);

            doc.moveDown(2);
            doc.fillColor('#9CA3AF').fontSize(8).text('Thank you for choosing Rental. If you have questions regarding this billing statement, contact support.', { align: 'center' });

            doc.end();

            writeStream.on('finish', () => {
                resolve(`/invoices/${fileName}`);
            });

            writeStream.on('error', (err) => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
};
