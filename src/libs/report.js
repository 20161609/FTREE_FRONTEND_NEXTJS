// src/libs/report.js

// import autoTable from 'jspdf-autotable';
// import { formatNumber } from '@/libs/santizer';
// import jsPDF from 'jspdf';
// import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// import ExcelJS from 'exceljs';
// import { api_get_receipt_image_multiple } from '@/libs/api_transaction';
// import { saveAs } from 'file-saver';
// import { formatDynamicAPIAccesses } from 'next/dist/server/app-render/dynamic-rendering';

import autoTable from 'jspdf-autotable';
import { formatNumber } from '@/libs/santizer';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import { api_get_receipt_image_multiple } from '@/libs/api_transaction';


export async function download_daily_xlsx(transactions, beginDate, endDate, displayCurrency) {
    if(transactions.length === 0) {
        alert('No transactions.');
        return;
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    // Add Headers (Set columns as needed)
    worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Branch', key: 'branch', width: 40 },
        { header: 'Income', key: 'income', width: 15 },
        { header: 'Outcome', key: 'outcome', width: 15 },
        { header: 'Balance', key: 'balance', width: 15 },
        { header: 'Description', key: 'description', width: 30 }
    ];

    // Apply styles to the header row (A~F)
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' } // Blue background
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'medium' },
            bottom: { style: 'medium' },
            left: { style: 'medium' },
            right: { style: 'medium' }
        };
    });

    // Modify the height of the header row
    headerRow.height = 20;
    
    // Insert data
    let totalIncome = 0;
    let totalOutcome = 0;
    transactions.forEach(t => {
        const transactionDate = new Date(t.date);
        if (transactionDate < beginDate || transactionDate > endDate) return;

        const income = t.cashFlow > 0 ? t.cashFlow : 0;
        const outcome = t.cashFlow < 0 ? -t.cashFlow : 0;
        totalIncome += income;
        totalOutcome += outcome;
        const balance = totalIncome - totalOutcome;

        worksheet.addRow({
            date: transactionDate.toLocaleDateString(),
            branch: t.branch,
            income: income,
            outcome: outcome,
            balance: balance,
            description: t.description
        });
    });

    // Add a total row
    const totalRow = worksheet.addRow({
        date: '',
        branch: 'Total',
        income: totalIncome,
        outcome: totalOutcome,
        balance: totalIncome - totalOutcome,
        description: ''
    });

    // Apply styles to the total row (A~F)
    totalRow.eachCell({ includeEmpty: false }, (cell) => {
        cell.font = { bold: true, size: 11, color: { argb: 'FF000000' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'medium' },
            bottom: { style: 'medium' },
            left: { style: 'medium' },
            right: { style: 'medium' }
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDBE7F1' } // Blue background
        };
    });

    // Format numbers as currency (Income, Outcome, Balance)
    worksheet.getColumn(3).numFmt = '#,##0'; // Income
    worksheet.getColumn(4).numFmt = '#,##0'; // Outcome
    worksheet.getColumn(5).numFmt = '#,##0'; // Balance


    // Style the data rows (A~F)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber !== 1) { // Skip the header row
            row.eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            row.height = 18; // Set row height
        }
    });

    // Create a buffer and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'daily.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export async function download_monthly_xlsx(transactions, beginDate, endDate, period = 1, displayCurrency) {
    if (!transactions || transactions.length === 0) {
        alert('No transactions.');
        return;
    }

    const parseDateOnly = (value) => {
        if (value instanceof Date) {
            return new Date(value.getFullYear(), value.getMonth(), value.getDate());
        }

        if (typeof value === 'string') {
            const trimmed = value.trim();
            const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

            if (match) {
                const year = Number(match[1]);
                const month = Number(match[2]);
                const day = Number(match[3]);
                return new Date(year, month - 1, day);
            }

            const fallback = new Date(trimmed);
            if (!Number.isNaN(fallback.getTime())) {
                return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
            }
        }

        return new Date(NaN);
    };

    const formatDateOnly = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getMonthEnd = (dateObj, monthSpan = 1) => {
        return new Date(dateObj.getFullYear(), dateObj.getMonth() + monthSpan, 0);
    };

    const shouldDivideBy100 = ['CAD', 'USD', 'EUR'].includes(displayCurrency);

    const normalizeMoney = (value) => {
        const numericValue = Number(value) || 0;
        return shouldDivideBy100 ? numericValue / 100 : numericValue;
    };

    const getNumberFormat = () => {
        return shouldDivideBy100 ? '#,##0.00' : '#,##0';
    };

    const beginDateObj = parseDateOnly(beginDate);
    const endDateObj = parseDateOnly(endDate);

    if (Number.isNaN(beginDateObj.getTime()) || Number.isNaN(endDateObj.getTime())) {
        alert('Invalid date range.');
        return;
    }

    if (beginDateObj > endDateObj) {
        alert('Invalid date range.');
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    const [FRONT_OFFSET, BACK_OFFSET, INPUT_OFFSET, OUTPUT_OFFSET, BALANCE_OFFSET] = [0, 1, 2, 3, 4];

    const dataBox = [];
    let currentFront = new Date(beginDateObj);

    while (currentFront <= endDateObj) {
        const rawBack = getMonthEnd(currentFront, period);
        const currentBack = rawBack > endDateObj ? new Date(endDateObj) : rawBack;

        dataBox.push([
            new Date(currentFront),
            new Date(currentBack),
            0,
            0,
            0,
        ]);

        currentFront = new Date(currentBack.getFullYear(), currentBack.getMonth() + 1, 1);
    }

    let totalIncome = 0;
    let totalOutcome = 0;

    const normalizedTransactions = transactions
        .map((t) => {
            const txDate = parseDateOnly(t.date);
            return {
                ...t,
                __parsedDate: txDate,
            };
        })
        .filter((t) => !Number.isNaN(t.__parsedDate.getTime()))
        .sort((a, b) => a.__parsedDate - b.__parsedDate);

    for (const t of normalizedTransactions) {
        const txDate = t.__parsedDate;

        if (txDate < beginDateObj || txDate > endDateObj) {
            continue;
        }

        const rawCashFlow = Number(t.cashFlow) || 0;
        const income = rawCashFlow > 0 ? normalizeMoney(rawCashFlow) : 0;
        const outcome = rawCashFlow < 0 ? normalizeMoney(Math.abs(rawCashFlow)) : 0;

        totalIncome += income;
        totalOutcome += outcome;

        const bucketIndex = dataBox.findIndex((row) => {
            return row[FRONT_OFFSET] <= txDate && txDate <= row[BACK_OFFSET];
        });

        if (bucketIndex === -1) {
            continue;
        }

        dataBox[bucketIndex][INPUT_OFFSET] += income;
        dataBox[bucketIndex][OUTPUT_OFFSET] += outcome;
    }

    let runningBalance = 0;
    for (const row of dataBox) {
        runningBalance += row[INPUT_OFFSET] - row[OUTPUT_OFFSET];
        row[BALANCE_OFFSET] = runningBalance;
    }

    worksheet.columns = [
        { header: 'Start Date', key: 'startDate', width: 15 },
        { header: 'End Date', key: 'endDate', width: 15 },
        { header: 'Income', key: 'totalIncome', width: 15 },
        { header: 'Outcome', key: 'totalOutcome', width: 15 },
        { header: 'Balance', key: 'balance', width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'medium' },
            bottom: { style: 'medium' },
            left: { style: 'medium' },
            right: { style: 'medium' },
        };
    });
    headerRow.height = 20;

    for (const row of dataBox) {
        const newRow = worksheet.addRow({
            startDate: formatDateOnly(row[FRONT_OFFSET]),
            endDate: formatDateOnly(row[BACK_OFFSET]),
            totalIncome: row[INPUT_OFFSET],
            totalOutcome: row[OUTPUT_OFFSET],
            balance: row[BALANCE_OFFSET],
        });

        newRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            if (colNumber === 3 || colNumber === 4 || colNumber === 5) {
                cell.numFmt = getNumberFormat();
            }
        });
    }

    const totalRow = worksheet.addRow({
        startDate: 'Total',
        endDate: '',
        totalIncome: totalIncome,
        totalOutcome: totalOutcome,
        balance: totalIncome - totalOutcome,
    });

    totalRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        cell.font = { bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (colNumber === 3 || colNumber === 4 || colNumber === 5) {
            cell.numFmt = getNumberFormat();
        }
    });

    worksheet.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (colNumber <= 5) {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            }
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob(
        [buffer],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${beginDate}_${endDate}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    return dataBox;
}

export async function download_receipt_pdf(transactions, beginDate, endDate, period = 1, displayCurrency) {
    if (transactions.length === 0) {
        alert('No transactions.');
        return;
    }

    let CHAR_ENCODER = null;

    try {
        const char_encoder_res = await fetch('/char_encoder.json');

        if (!char_encoder_res.ok) {
            throw new Error(`Failed to load char_encoder.json: ${char_encoder_res.status}`);
        }

        const body = await char_encoder_res.json();
        CHAR_ENCODER = body?.CHAR_ENCODER;

        if (!CHAR_ENCODER) {
            throw new Error('CHAR_ENCODER is missing in char_encoder.json');
        }
    } catch (error) {
        console.error('Failed to load PDF font data:', error);
        alert('PDF font file could not be loaded.');
        return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const PAGE_WIDTH = doc.internal.pageSize.getWidth();
    const PAGE_HEIGHT = doc.internal.pageSize.getHeight();

    const beginDateObj = new Date(beginDate);
    const endDateObj = new Date(endDate);

    if (Number.isNaN(beginDateObj.getTime()) || Number.isNaN(endDateObj.getTime())) {
        alert('Invalid date range.');
        return;
    }

    let front = new Date(beginDateObj);
    let back = new Date(front.getFullYear(), front.getMonth() + period, 0);
    const dataBox = [];

    while (front <= endDateObj) {
        dataBox.push([front, new Date(Math.min(back, endDateObj)), []]);
        front = new Date(front.getFullYear(), front.getMonth() + period, 1);
        back = new Date(front.getFullYear(), front.getMonth() + period, 0);
    }

    let dateIndex = 0;
    let imageIndex = 1;
    const tidList = [];

    transactions.forEach((t) => {
        const tDate = new Date(t.date);
        if (Number.isNaN(tDate.getTime())) return;
        if (!(beginDateObj <= tDate && tDate <= endDateObj)) return;

        dateIndex = 0;
        while (!(dataBox[dateIndex][0] <= tDate && tDate <= dataBox[dateIndex][1])) {
            dateIndex++;
            if (dateIndex >= dataBox.length) return;
        }

        let currentImageIndex = null;

        if (t.receipt) {
            currentImageIndex = imageIndex++;
            tidList.push(t.tid);
        }

        dataBox[dateIndex][2].push({
            transaction: t,
            imageIndex: currentImageIndex,
        });
    });

    let receiptUrlDict = {};
    try {
        receiptUrlDict = tidList.length > 0 ? await api_get_receipt_image_multiple(tidList) : {};
    } catch (error) {
        console.error('Failed to load receipt images:', error);
        receiptUrlDict = {};
    }

    try {
        doc.addFileToVFS('malgun.ttf', CHAR_ENCODER);
        doc.addFont('malgun.ttf', 'malgun', 'normal');
        doc.setFont('malgun');
    } catch (error) {
        console.error('Failed to register PDF font:', error);
        alert('PDF font registration failed.');
        return;
    }

    const primaryColor = '#4a90e2';

    dataBox.forEach((dataPage, i) => {
        const rows = [];
        const trBox = dataPage[2];
        let balance = 0;
        const receiptImages = [];

        let totalIncome = 0;
        let totalOutcome = 0;

        trBox.forEach((item) => {
            const tr = item.transaction;
            const income = tr.cashFlow > 0 ? tr.cashFlow : 0;
            const outcome = tr.cashFlow < 0 ? Math.abs(tr.cashFlow) : 0;

            totalIncome += income;
            totalOutcome += outcome;
            balance = totalIncome - totalOutcome;

            const receiptLabel = item.imageIndex !== null ? item.imageIndex : 'No Receipt';

            rows.push([
                tr.date,
                tr.branch,
                formatNumber(income, displayCurrency),
                formatNumber(outcome, displayCurrency),
                formatNumber(balance, displayCurrency),
                receiptLabel,
            ]);

            if (item.imageIndex !== null) {
                const img = receiptUrlDict?.[tr.tid];
                receiptImages.push({
                    img,
                    index: item.imageIndex,
                });
            }
        });

        rows.push([
            'Total',
            '',
            formatNumber(totalIncome, displayCurrency),
            formatNumber(totalOutcome, displayCurrency),
            formatNumber(balance, displayCurrency),
            '',
        ]);

        doc.setFillColor(primaryColor);
        doc.rect(0, 0, PAGE_WIDTH, 20, 'F');
        doc.setFontSize(18);
        doc.setTextColor('#ffffff');
        doc.text(
            `Transactions from ${dataPage[0].toLocaleDateString()} to ${dataPage[1].toLocaleDateString()}`,
            PAGE_WIDTH / 2,
            13,
            { align: 'center' }
        );

        if (rows.length > 1) {
            autoTable(doc, {
                head: [['Date', 'Branch', 'Income', 'Outcome', 'Balance', 'Receipt']],
                body: rows,
                startY: 30,
                theme: 'striped',
                styles: {
                    fillColor: [245, 245, 245],
                    textColor: 50,
                    fontSize: 10,
                    font: 'malgun',
                },
                headStyles: {
                    fillColor: primaryColor,
                    textColor: '#ffffff',
                    fontSize: 12,
                    halign: 'center',
                },
                columnStyles: {
                    2: { halign: 'right' },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'center' },
                },
                didParseCell: function (data) {
                    if (data.row.index === rows.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                    }
                },
            });
        } else {
            doc.setFontSize(12);
            doc.setTextColor(50);
            doc.text('No transactions during this period.', 10, 30);
        }

        if (receiptImages.length > 0) {
            doc.addPage();

            for (let imgIndex = 0; imgIndex < receiptImages.length;) {
                if (imgIndex > 0 && imgIndex % 4 === 0) doc.addPage();

                for (
                    let imgCount = 0;
                    imgCount < 4 && imgIndex < receiptImages.length;
                    imgCount++, imgIndex++
                ) {
                    const { img, index } = receiptImages[imgIndex];
                    const xPos = (imgCount % 2) * (PAGE_WIDTH / 2) + 10;
                    const yPos = Math.floor(imgCount / 2) * (PAGE_HEIGHT / 2) + 20;
                    const maxWidth = PAGE_WIDTH / 2 - 20;
                    const maxHeight = PAGE_HEIGHT / 2 - 30;

                    if (img) {
                        try {
                            const imgProps = doc.getImageProperties(img);
                            const imgWidth = imgProps.width;
                            const imgHeight = imgProps.height;

                            const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
                            const width = imgWidth * ratio;
                            const height = imgHeight * ratio;

                            const xCentered = xPos + (maxWidth - width) / 2;
                            const yCentered = yPos + (maxHeight - height) / 2 + 10;

                            doc.setDrawColor(200);
                            doc.rect(xPos, yPos - 10, maxWidth + 20, maxHeight + 20);

                            doc.setFontSize(12);
                            doc.setTextColor(primaryColor);
                            doc.text(`Receipt #${index}`, xPos + 5, yPos - 2);

                            doc.addImage(img, 'JPEG', xCentered, yCentered, width, height);
                        } catch (error) {
                            console.error(`Failed to render receipt image. tid/index=${index}`, error);
                            doc.setFontSize(12);
                            doc.setTextColor(100);
                            doc.text(`Receipt #${index} could not be rendered`, xPos + 5, yPos + 20);
                        }
                    } else {
                        doc.setFontSize(12);
                        doc.setTextColor(100);
                        doc.text('No Receipt Image', xPos + 20, yPos + maxHeight / 2);
                    }
                }
            }
        }

        if (i < dataBox.length - 1) doc.addPage();
    });

    doc.save('accounting_ledger.pdf');
}

export async function download_tree_xlsx2(transactions, beginDate, endDate, period = 1, branch, maxDepth = 10, displayCurrency) {
    const branchDict = {};
    const tree = {};
    const ROOT_BRANCH_PATH = branch.path;
    const stack = [branch];

    // Compute the tree structure as a dictionary
    while (stack.length > 0) {
        const curBranch = stack.pop();
        branchDict[curBranch.path] = [];

        for (let child in curBranch.children) {
            const childBranch = curBranch.children[child];
            stack.push(childBranch);
        }
    }

    // Divide the period based on the start and end dates
    let front = new Date(beginDate);
    let back = new Date(front.getFullYear(), front.getMonth() + period, 0);
    const dataBox = [];

    // Create space in the data box to store income and expenses for each period
    while (front <= new Date(endDate)) {
        dataBox.push([front, new Date(Math.min(back, new Date(endDate))), []]);
        front = new Date(front.getFullYear(), front.getMonth() + period, 1);
        back = new Date(front.getFullYear(), front.getMonth() + period, 0);

        // Initialize income and expenses for each branch
        for (let branchPath in branchDict) {
            branchDict[branchPath].push({ income: 0, outcome: 0 });
        }
    }

    // Aggregate income and expenses by transaction data
    let dateIndex = 0;
    for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];
        const tDate = new Date(t.date);
        if (!(beginDate <= tDate && tDate <= endDate))
            continue;

        dateIndex = 0;
        while (!(dataBox[dateIndex][0] <= tDate && tDate <= dataBox[dateIndex][1])) {
            dateIndex++;
            if (dateIndex >= dataBox.length)
                break;
        }

        if (dateIndex >= dataBox.length) break;

        const income = t.cashFlow > 0 ? t.cashFlow : 0;
        const outcome = t.cashFlow < 0 ? -t.cashFlow : 0;

        // Aggregate income and expenses by branch
        if (!branchDict[t.branch][dateIndex]) {
            branchDict[t.branch][dateIndex] = { income: 0, outcome: 0 };
        }

        dataBox[dateIndex][2].push({ transaction: t, income, outcome });
        branchDict[t.branch][dateIndex].income += income;
        branchDict[t.branch][dateIndex].outcome += outcome;
    }

    // Create an Excel workbook using ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tree Transactions');

    // Set Headers
    worksheet.columns = [
        { header: 'Branch', key: 'branch', width: 30 },
        { header: 'Start Date', key: 'startDate', width: 15 },
        { header: 'End Date', key: 'endDate', width: 15 },
        { header: 'Income', key: 'income', width: 15 },
        { header: 'Outcome', key: 'outcome', width: 15 }
    ];

    // Add data for each branch to the Excel worksheet
    for (let branchPath in branchDict) {
        branchDict[branchPath].forEach((data, index) => {
            const row = {
                branch: branchPath,
                startDate: dataBox[index][0].toISOString().split('T')[0],
                endDate: dataBox[index][1].toISOString().split('T')[0],
                income: data.income,
                outcome: data.outcome
            };
            worksheet.addRow(row);
        });
    }

    // Download the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tree_transactions_${beginDate}_${endDate}.xlsx`;
    link.click();

    // Clean up the URL after download
    window.URL.revokeObjectURL(link.href);
}

export async function download_tree_xlsx(
    transactions,
    beginDate,
    endDate,
    period = 1,
    branch,
    maxDepth = 10,
    displayCurrency
  ) {
    const branchDict = {};
    const ROOT_BRANCH_PATH = branch.path;
    const stack = [branch];
  
    // Construct the tree structure as a dictionary
    while (stack.length > 0) {
      const curBranch = stack.pop();
      branchDict[curBranch.path] = [];
  
      const childrenKeys = Object.keys(curBranch.children).reverse();

      for (const key of childrenKeys) {
        const childBranch = curBranch.children[key];
        stack.push(childBranch);
      }
      
    }
  
    // Divide the period based on the start and end dates
    let front = new Date(beginDate);
    let back = new Date(front.getFullYear(), front.getMonth() + period, 0);
    const dataBox = [];
    let periodCount = 1;
  
    // Create space in the data box to store income and expenses for each period
    while (front <= new Date(endDate)) {
      dataBox.push({
        period: `Period ${periodCount++}`,
        startDate: new Date(front),
        endDate: new Date(Math.min(back, new Date(endDate))),
        transactions: [],
      });
      front = new Date(front.getFullYear(), front.getMonth() + period, 1);
      back = new Date(front.getFullYear(), front.getMonth() + period, 0);
  
      // Initialize income and expenses for each branch
      for (let branchPath in branchDict) {
        branchDict[branchPath].push({ income: 0, outcome: 0 });
      }
    }
  
    // Aggregate income and expenses by transaction data
    let dateIndex = 0;
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      const tDate = new Date(t.date);
      if (!(beginDate <= tDate && tDate <= endDate)) continue;
  
      dateIndex = 0;
      while (
        !(
          dataBox[dateIndex].startDate <= tDate &&
          tDate <= dataBox[dateIndex].endDate
        )
      ) {
        dateIndex++;
        if (dateIndex >= dataBox.length) break;
      }
  
      if (dateIndex >= dataBox.length) break;
  
      const income = t.cashFlow > 0 ? t.cashFlow : 0;
      const outcome = t.cashFlow < 0 ? -t.cashFlow : 0;
  
      dataBox[dateIndex].transactions.push({ transaction: t, income, outcome });
  
      var branchNode = t.branch;
      branchDict[branchNode][dateIndex].income += income;
      branchDict[branchNode][dateIndex].outcome += outcome;
      while (branchNode != ROOT_BRANCH_PATH) {
        branchNode = branchNode.substring(0, branchNode.lastIndexOf('/'));
        branchDict[branchNode][dateIndex].income += income;
        branchDict[branchNode][dateIndex].outcome += outcome;
      }
    }
  
    // Create an Excel workbook using ExcelJS
    const workbook = new ExcelJS.Workbook();
  
    // Income Sheet
    const incomeSheet = workbook.addWorksheet('Income');
    incomeSheet.views = [{ state: 'frozen', xSplit: 1 }]; // Fix column A
  
    // Outcome Sheet
    const outcomeSheet = workbook.addWorksheet('Outcome');
    outcomeSheet.views = [{ state: 'frozen', xSplit: 1 }]; // Fix column A
  
    // Style settings: Header style
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' },
      }, // Blue background
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' },
      },
    };
  
    // Style settings: Data cell style
    const dataStyle = {
      font: { bold: false, color: { argb: 'FF000000' }, size: 8 },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      },
    };
  
    // Style settings: Bold data cell style (for total)
    const boldDataStyle = {
      font: { bold: true, color: { argb: 'FF000000' }, size: 8 },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      },
    };
  
    // Style settings: Left-aligned style
    const leftAlignStyle = {
      font: { bold: false, color: { argb: 'FF000000' }, size: 8 },
      alignment: { vertical: 'middle', horizontal: 'left' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      },
    };
  
    // Function to format numbers
    // const formatNumber = (num) => {
    //   return num.toLocaleString('en-US', { minimumFractionDigits: 0 });
    // };
  
    // Function to calculate color based on depth
    const getDepthColor = (depth, maxDepth) => {
      // Color value calculation (darker color for deeper depth)
      const baseColor = 255;
      const colorValue = Math.max(baseColor - depth * (200 / maxDepth), 55); // Set minimum value to 55
      const hexValue = Math.floor(colorValue).toString(16).padStart(2, '0');
      const color = `FF${hexValue}${hexValue}${hexValue}`; // Gray scale color
      return color;
    };
  
    // Set 'Branch' header (merge A1:A2)
    incomeSheet.mergeCells('A1:A2');
    incomeSheet.getCell('A1').value = 'Branch';
    incomeSheet.getCell('A1').style = headerStyle;
  
    outcomeSheet.mergeCells('A1:A2');
    outcomeSheet.getCell('A1').value = 'Branch';
    outcomeSheet.getCell('A1').style = headerStyle;
  
    // Add 'Period' header and dates for each period
    let columnIndex = 2; // Column index starts from 2
    dataBox.forEach((data, index) => {
      // Set 'Period' header (merge B1:C1, D1:E1, ...)
        incomeSheet.mergeCells(1, columnIndex, 1, columnIndex + 1);
        incomeSheet.getCell(1, columnIndex).value = `Period ${index + 1}`;
        incomeSheet.getCell(1, columnIndex).style = headerStyle;
  
        outcomeSheet.mergeCells(1, columnIndex, 1, columnIndex + 1);
        outcomeSheet.getCell(1, columnIndex).value = `Period ${index + 1}`;
        outcomeSheet.getCell(1, columnIndex).style = headerStyle;
  
        // Date format: 'YY.MM.DD'
        const formatDate = (date) => {
            const year = date.getFullYear().toString().slice(2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}.${month}.${day}`;
        };
  
        // Set start and end dates and apply styles
        incomeSheet.getCell(2, columnIndex).value = formatDate(data.startDate);
        incomeSheet.getCell(2, columnIndex).style = dataStyle;
  
        incomeSheet.getCell(2, columnIndex + 1).value = formatDate(data.endDate);
        incomeSheet.getCell(2, columnIndex + 1).style = dataStyle;
  
        outcomeSheet.getCell(2, columnIndex).value = formatDate(data.startDate);
        outcomeSheet.getCell(2, columnIndex).style = dataStyle;
  
        outcomeSheet.getCell(2, columnIndex + 1).value = formatDate(data.endDate);
        outcomeSheet.getCell(2, columnIndex + 1).style = dataStyle;
  
        columnIndex += 2;
    });
  
    // Set 'Total' header (merge D1:E1, G1:H1, ...)
    incomeSheet.mergeCells(1, columnIndex, 2, columnIndex);
    incomeSheet.getCell(1, columnIndex).value = 'Total';
    incomeSheet.getCell(1, columnIndex).style = headerStyle;
  
    outcomeSheet.mergeCells(1, columnIndex, 2, columnIndex);
    outcomeSheet.getCell(1, columnIndex).value = 'Total';
    outcomeSheet.getCell(1, columnIndex).style = headerStyle;
  
    // Add income and expenses for each branch to the sheet
    let rowIndex = 3; // Row index starts from 3
    for (let branchPath in branchDict) {
        // Aggregate income and expenses by branch
        const depth = branchPath.split('/').length - 1; // Depth of the branch
  
        // Calculate color based on depth
        const depthColor = getDepthColor(depth, maxDepth);
  
        // Branch path
        incomeSheet.getCell(rowIndex, 1).value = branchPath;
        outcomeSheet.getCell(rowIndex, 1).value = branchPath;
  
        // Branch path style
        const branchStyle = {
            font: { bold: true, color: { argb: 'FF000000' }, size: 8 },
            alignment: { vertical: 'middle', horizontal: 'left' },
            fill: {type: 'pattern', pattern: 'solid', fgColor: { argb: depthColor }},
            border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
            },
        };
      incomeSheet.getCell(rowIndex, 1).style = branchStyle;
      outcomeSheet.getCell(rowIndex, 1).style = branchStyle;
  
      // Input income and expenses for each period
      let columnIndex = 2;
      let totalIncome = 0;
      let totalOutcome = 0;
      branchDict[branchPath].forEach((data, index) => {
        // Income Sheet
        incomeSheet.mergeCells(rowIndex, columnIndex, rowIndex, columnIndex + 1); // Merge two cells
        const incomeCell = incomeSheet.getCell(rowIndex, columnIndex);
        incomeCell.value = formatNumber(data.income, displayCurrency); // Format income value
        incomeCell.style = dataStyle;
  
        // Set Style for the merged cell
        incomeSheet.getCell(rowIndex, columnIndex + 1).style = dataStyle;
  
        // Outcome Sheet
        outcomeSheet.mergeCells(rowIndex, columnIndex, rowIndex, columnIndex + 1); // Merge two cells
        const outcomeCell = outcomeSheet.getCell(rowIndex, columnIndex);
        outcomeCell.value = formatNumber(data.outcome, displayCurrency); // Format outcome value
        outcomeCell.style = dataStyle;
  
        // Set Style for the merged cell
        outcomeSheet.getCell(rowIndex, columnIndex + 1).style = dataStyle;
  
        // Calculate the total income and expenses for each branch
        totalIncome += data.income;
        totalOutcome += data.outcome;
  
        columnIndex += 2;
      });
  
      // Input total income and expenses
      const incomeTotalCell = incomeSheet.getCell(rowIndex, columnIndex);
      incomeTotalCell.value = formatNumber(totalIncome, displayCurrency);
      incomeTotalCell.style = boldDataStyle;
  
      const outcomeTotalCell = outcomeSheet.getCell(rowIndex, columnIndex);
      outcomeTotalCell.value = formatNumber(totalOutcome, displayCurrency);
      outcomeTotalCell.style = boldDataStyle;
  
      rowIndex++;
    }
  
    // Modify the width of the columns
    incomeSheet.getColumn(1).width = 30;
    outcomeSheet.getColumn(1).width = 30;
  
    // Set the width of the remaining columns to be narrow
    for (let i = 2; i <= incomeSheet.columnCount; i++) {
      incomeSheet.getColumn(i).width = 9; // Set the width of the column to 9
      outcomeSheet.getColumn(i).width = 9;
    }
  
    // Create a buffer and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tree_transactions_${beginDate}_${endDate}.xlsx`;
    link.click();
  
    // Clean up the URL after download
    window.URL.revokeObjectURL(link.href);
}
  
