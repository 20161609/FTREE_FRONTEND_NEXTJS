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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Branch', key: 'branch', width: 40 },
        { header: 'Income', key: 'income', width: 15 },
        { header: 'Outcome', key: 'outcome', width: 15 },
        { header: 'Balance', key: 'balance', width: 15 },
        { header: 'Description', key: 'description', width: 30 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'medium' },
            bottom: { style: 'medium' },
            left: { style: 'medium' },
            right: { style: 'medium' }
        };
    });
    headerRow.height = 20;

    let totalIncome = 0;
    let totalOutcome = 0;

    const sortedTransactions = [...transactions]
        .map((t) => ({
            ...t,
            __parsedDate: parseDateOnly(t.date),
        }))
        .filter((t) => !Number.isNaN(t.__parsedDate.getTime()))
        .sort((a, b) => a.__parsedDate - b.__parsedDate);

    sortedTransactions.forEach((t) => {
        const transactionDate = t.__parsedDate;
        if (transactionDate < beginDateObj || transactionDate > endDateObj) return;

        const rawCashFlow = Number(t.cashFlow) || 0;
        const income = rawCashFlow > 0 ? normalizeMoney(rawCashFlow) : 0;
        const outcome = rawCashFlow < 0 ? normalizeMoney(Math.abs(rawCashFlow)) : 0;

        totalIncome += income;
        totalOutcome += outcome;
        const balance = totalIncome - totalOutcome;

        worksheet.addRow({
            date: formatDateOnly(transactionDate),
            branch: t.branch,
            income: income,
            outcome: outcome,
            balance: balance,
            description: t.description
        });
    });

    const totalRow = worksheet.addRow({
        date: '',
        branch: 'Total',
        income: totalIncome,
        outcome: totalOutcome,
        balance: totalIncome - totalOutcome,
        description: ''
    });

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
            fgColor: { argb: 'FFDBE7F1' }
        };
    });

    worksheet.getColumn(3).numFmt = getNumberFormat();
    worksheet.getColumn(4).numFmt = getNumberFormat();
    worksheet.getColumn(5).numFmt = getNumberFormat();

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber !== 1) {
            row.eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            row.height = 18;
        }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

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
    if (!transactions || transactions.length === 0) {
        alert('No transactions.');
        return;
    }

    if (!branch || !branch.path) {
        alert('Invalid branch.');
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

    const getPeriodEnd = (dateObj, monthSpan = 1) => {
        return new Date(dateObj.getFullYear(), dateObj.getMonth() + monthSpan, 0);
    };

    const getDepthFromRoot = (rootPath, targetPath) => {
        if (targetPath === rootPath) return 0;
        if (!targetPath.startsWith(`${rootPath}/`)) return Infinity;

        const rootDepth = rootPath.split('/').filter(Boolean).length;
        const targetDepth = targetPath.split('/').filter(Boolean).length;
        return targetDepth - rootDepth;
    };

    const normalizeBranchPath = (branchPath, rootPath) => {
        if (!branchPath || typeof branchPath !== 'string') {
            return rootPath;
        }

        const trimmed = branchPath.trim();
        if (trimmed === '') {
            return rootPath;
        }

        if (trimmed === rootPath || trimmed.startsWith(`${rootPath}/`)) {
            return trimmed;
        }

        if (trimmed.startsWith('/')) {
            return `${rootPath}${trimmed}`;
        }

        return `${rootPath}/${trimmed}`;
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

    const ROOT_BRANCH_PATH = branch.path;
    const branchDict = {};
    const orderedBranchPaths = [];
    const stack = [{ node: branch, depth: 0 }];

    while (stack.length > 0) {
        const { node, depth } = stack.pop();
        const currentPath = node.path;

        if (depth > maxDepth) {
            continue;
        }

        branchDict[currentPath] = [];
        orderedBranchPaths.push(currentPath);

        const children = node.children || {};
        const childKeys = Object.keys(children).reverse();

        for (const key of childKeys) {
            stack.push({
                node: children[key],
                depth: depth + 1,
            });
        }
    }

    const dataBox = [];
    let currentFront = new Date(beginDateObj);

    while (currentFront <= endDateObj) {
        const rawBack = getPeriodEnd(currentFront, period);
        const currentBack = rawBack > endDateObj ? new Date(endDateObj) : rawBack;

        dataBox.push({
            startDate: new Date(currentFront),
            endDate: new Date(currentBack),
        });

        currentFront = new Date(currentBack.getFullYear(), currentBack.getMonth() + 1, 1);
    }

    if (dataBox.length === 0) {
        alert('No transactions.');
        return;
    }

    for (const branchPath of orderedBranchPaths) {
        for (let i = 0; i < dataBox.length; i++) {
            branchDict[branchPath].push({ income: 0, outcome: 0 });
        }
    }

    const normalizedTransactions = transactions
        .map((t) => {
            const parsedDate = parseDateOnly(t.date);
            const normalizedBranch = normalizeBranchPath(t.branch, ROOT_BRANCH_PATH);

            return {
                ...t,
                __parsedDate: parsedDate,
                __normalizedBranch: normalizedBranch,
            };
        })
        .filter((t) => {
            if (Number.isNaN(t.__parsedDate.getTime())) return false;
            if (!t.__normalizedBranch.startsWith(ROOT_BRANCH_PATH)) return false;
            if (getDepthFromRoot(ROOT_BRANCH_PATH, t.__normalizedBranch) > maxDepth) return false;
            return true;
        })
        .sort((a, b) => a.__parsedDate - b.__parsedDate);

    for (const t of normalizedTransactions) {
        const tDate = t.__parsedDate;

        if (tDate < beginDateObj || tDate > endDateObj) {
            continue;
        }

        const bucketIndex = dataBox.findIndex((box) => {
            return box.startDate <= tDate && tDate <= box.endDate;
        });

        if (bucketIndex === -1) {
            continue;
        }

        const rawCashFlow = Number(t.cashFlow) || 0;
        const income = rawCashFlow > 0 ? normalizeMoney(rawCashFlow) : 0;
        const outcome = rawCashFlow < 0 ? normalizeMoney(Math.abs(rawCashFlow)) : 0;

        let branchNode = t.__normalizedBranch;

        while (true) {
            if (branchDict[branchNode] && branchDict[branchNode][bucketIndex]) {
                branchDict[branchNode][bucketIndex].income += income;
                branchDict[branchNode][bucketIndex].outcome += outcome;
            }

            if (branchNode === ROOT_BRANCH_PATH) {
                break;
            }

            const lastSlashIndex = branchNode.lastIndexOf('/');
            if (lastSlashIndex === -1) {
                break;
            }

            branchNode = branchNode.substring(0, lastSlashIndex);

            if (!branchNode.startsWith(ROOT_BRANCH_PATH)) {
                break;
            }
        }
    }

    const workbook = new ExcelJS.Workbook();
    const incomeSheet = workbook.addWorksheet('Income');
    const outcomeSheet = workbook.addWorksheet('Outcome');

    incomeSheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
    outcomeSheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];

    const applyHeaderStyle = (sheet, rowNumber, colCount) => {
        const row = sheet.getRow(rowNumber);
        for (let col = 1; col <= colCount; col++) {
            const cell = row.getCell(col);
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
        }
        row.height = 20;
    };

    const applyDataStyle = (sheet, fromRow, toRow, numberColumns = []) => {
        for (let rowNumber = fromRow; rowNumber <= toRow; rowNumber++) {
            const row = sheet.getRow(rowNumber);
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' },
                };

                if (numberColumns.includes(colNumber)) {
                    cell.numFmt = getNumberFormat();
                }
            });
            row.height = 18;
        }
    };

    const buildSheet = (sheet, type) => {
        const headerRowValues = ['Branch'];
        dataBox.forEach((box) => {
            headerRowValues.push(`${formatDateOnly(box.startDate)} ~ ${formatDateOnly(box.endDate)}`);
        });
        headerRowValues.push('Total');

        sheet.addRow(headerRowValues);
        applyHeaderStyle(sheet, 1, headerRowValues.length);

        sheet.getColumn(1).width = 40;
        for (let i = 2; i <= headerRowValues.length; i++) {
            sheet.getColumn(i).width = 18;
        }

        orderedBranchPaths.forEach((branchPath) => {
            const rowValues = [branchPath];
            let branchTotal = 0;

            branchDict[branchPath].forEach((periodData) => {
                const amount = type === 'income' ? periodData.income : periodData.outcome;
                rowValues.push(amount);
                branchTotal += amount;
            });

            rowValues.push(branchTotal);
            sheet.addRow(rowValues);
        });

        const totalRowValues = ['Total'];
        let grandTotal = 0;

        for (let i = 0; i < dataBox.length; i++) {
            let periodTotal = 0;

            orderedBranchPaths.forEach((branchPath) => {
                const amount = type === 'income'
                    ? branchDict[branchPath][i].income
                    : branchDict[branchPath][i].outcome;

                if (getDepthFromRoot(ROOT_BRANCH_PATH, branchPath) === 0) {
                    periodTotal += amount;
                }
            });

            totalRowValues.push(periodTotal);
            grandTotal += periodTotal;
        }

        totalRowValues.push(grandTotal);
        sheet.addRow(totalRowValues);

        const lastRowNumber = sheet.lastRow.number;
        const totalRow = sheet.getRow(lastRowNumber);
        totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.font = { bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'medium' },
                bottom: { style: 'medium' },
                left: { style: 'medium' },
                right: { style: 'medium' },
            };
            if (colNumber >= 2) {
                cell.numFmt = getNumberFormat();
            }
        });

        applyDataStyle(sheet, 2, lastRowNumber - 1, Array.from({ length: headerRowValues.length - 1 }, (_, idx) => idx + 2));
    };

    buildSheet(incomeSheet, 'income');
    buildSheet(outcomeSheet, 'outcome');

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob(
        [buffer],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tree_transactions_${beginDate}_${endDate}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    return {
        dataBox,
        branchDict,
    };
}  
