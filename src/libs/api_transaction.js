// src/libs/api_transaction.js

const BASIC_URL = process.env.NEXT_PUBLIC_BASIC_URL;

// Uploads a new transaction with receipt to the server
export async function upload_transaction(t_date, branch, cashflow, description, receiptFile) {
    // Create FormData object
    const formData = new FormData();
    formData.append('t_date', t_date);
    formData.append('branch', branch);
    formData.append('cashflow', cashflow);
    formData.append('description', description);
    formData.append('receipt', receiptFile); // Image file to be uploaded

    // Get id_token
    const id_token = localStorage.getItem('idToken');
    if (!id_token) {
        throw new Error('Login is required.');
    }
    
    const url = `${BASIC_URL}/db/upload-transaction/`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${id_token}` },
            body: formData
        });
    
        if (response.ok) {
            const data = await response.json();
            console.log('Transaction uploaded successfully:', data);
        } else {
            console.error('Failed to upload transaction:', response.statusText);
        }
    } catch (error) {
        console.error('Error uploading transaction:', error);
    }    
}

// Fetches daily transactions for a specified branch and date range
export async function api_refer_daily(branch = 'Home', begin_date = '0001-01-01', end_date = '9999-12-31') {
    // Get Id Token
    const id_token = localStorage.getItem('idToken');
    if (!id_token) {
        throw new Error('Login is required.');
    }

    // Pass data as query parameters
    const queryParams = new URLSearchParams({
        branch: branch,
        begin_date: begin_date,
        end_date: end_date
    }).toString();

    // Get Transaction Data
    const url = `${BASIC_URL}/db/refer-daily2/?${queryParams}`;
    const headers = {
        'Authorization': `Bearer ${id_token}`
    };

    const response = await fetch(url, {
        method: 'GET',
        headers: headers
    });

    if (response.ok) {
        const data = await response.json();
        const transactions = [];
        var curBalance = 0;
        for (const item of data) {
            const receipt = item.receipt ? item.receipt : null;
            const branchPath = item.branch;
            const cashFlow = item.cashflow;
            curBalance += cashFlow;

            const balance = curBalance;
            const date = item.t_date;
            const tid = item.tid;
            const description = item.description;

            transactions.push({
                tid: tid,
                branch: branchPath,
                date: date,
                cashFlow: cashFlow,
                balance: balance,
                receipt: receipt,
                description: description
            });
        }

        console.log('Transaction data:', transactions);
        return transactions;
    } else {
        console.error('Failed to get transaction data:', response.statusText);
    }
}

// Retrieves the receipt image based on the file path
export async function api_get_receipt_image(file_path) {
    const id_token = localStorage.getItem('idToken');
    if (!id_token) {
        throw new Error('Login is required.');
    }

    const url = `${BASIC_URL}/db/get-receipt2/?file_path=${encodeURIComponent(file_path)}`;
    const headers = {
        'Authorization': `Bearer ${id_token}`
    };

    const response = await fetch(url, {
        method: 'GET',
        headers: headers
    });

    if (!response.ok) {  
        console.error('Failed to get receipt image:', response.statusText);
        return null;
    }

    const imageUrl = await response.json();
    console.log('Receipt image URL:', imageUrl);

    return imageUrl;
}

// Deletes a transaction by its ID
export async function api_delete_transaction(tid) {
    const id_token = localStorage.getItem('idToken');
    if (!id_token) {
        throw new Error('Login is required.');
    }

    const url = `${BASIC_URL}/db/delete-transaction/`;
    const headers = {
        'Authorization': `Bearer ${id_token}`,
        'Content-Type': 'application/json'
    };

    const data = {
        tid: tid
    };

    const response = await fetch(url, {
        method: 'DELETE',
        headers: headers,
        body: JSON.stringify(data)
    });

    if (response.ok) {
        console.log('Transaction deleted successfully');
    } else {
        console.error('Failed to delete transaction:', response.statusText);
    }
}

// Modifies an existing transaction by its ID
export async function api_modify_transaction(tid, t_date, branch, cashflow, description, receipt) {
    const id_token = localStorage.getItem('idToken');
    if (!id_token) {
        throw new Error('Login is required.');
    }

    const formData = new FormData();
    formData.append('tid', tid);
    formData.append('t_date', t_date);
    formData.append('branch', branch);
    formData.append('cashflow', cashflow);
    formData.append('description', description);
    formData.append('receipt', receipt);

    const url = `${BASIC_URL}/db/modify-transaction/`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${id_token}` },
        body: formData,
        mode: 'cors'
    });

    if (response.ok) {
        console.log('Transaction modified successfully');
    } else {
        console.error('Failed to modify transaction:', response.statusText);
    }
}
