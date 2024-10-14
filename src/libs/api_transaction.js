// src/libs/api_transaction.js
import JSZip from "jszip";

const BASIC_URL = process.env.NEXT_PUBLIC_BASIC_URL;

// Fetches daily transactions for a specified branch and date range
export async function api_refer_daily(
    branch = 'Home', begin_date = '0001-01-01', 
    end_date = '9999-12-31') {
    
    // Pass data as query parameters
    const url = new URL(`${BASIC_URL}/db/refer-daily-transaction/`);
    url.searchParams.append('branch', branch);
    url.searchParams.append('begin_date', begin_date);
    url.searchParams.append('end_date', end_date);

    const response = await fetch(url, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
    });

    if (response.ok) {
        const body = await response.json();
        const data = body.message;
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
        console.log(transactions);
        return transactions;
    } else {
        console.error('Failed to get transaction data:', response);
        return []
    }
}

// Uploads a new transaction with receipt to the server
export async function api_upload_transaction(
    t_date, branch, cashflow, description, receiptFile) {

    // FormData 객체 생성
    const formData = new FormData();

    // 필수 필드 추가
    formData.append("t_date", t_date);
    formData.append("branch", branch);
    formData.append("cashflow", cashflow);
    
    // 선택적 필드 추가 (description)
    if (description) {
        formData.append("description", description);
    }

    // 파일 추가 (선택적)
    if (receiptFile) {
        formData.append("receipt", receiptFile);
    }

    try {
        // Fetch 요청 보내기 (FormData와 Bearer 토큰 포함)
        const url = `${BASIC_URL}/db/upload-transaction/`;
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            body: formData  // FormData 객체를 본문으로 전송
        });

        // 응답이 성공적이지 않은 경우 에러 처리
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error uploading transaction:", errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 서버에서 받은 데이터 처리
        const data = await response.json();
        console.log("Transaction uploaded:", data);

        // 성공적으로 업로드된 트랜잭션 정보 반환
        return data;  
    } catch (error) {
        console.error("Error uploading transaction:", error);
        throw error;  // 에러 발생 시 예외 전달
    }
}

// Retrieves the receipt image based on the file path
export async function api_get_receipt_image(tid) {
    const url = new URL(`${BASIC_URL}/db/get-receipt/`);
    url.searchParams.append('tid', tid);
    const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        console.error('Failed to get receipt image:', response.statusText);
        return null;
    }

    const imageUrl = await response.json();
    return imageUrl;
}

// Modifies an existing transaction by its ID
export async function api_modify_transaction(tid, t_date, branch, cashflow, description, receiptFile) {
    // FormData 객체 생성
    const formData = new FormData();
    formData.append('tid', tid);  // 필수 필드: 트랜잭션 ID

    // 선택적 필드만 추가 (값이 존재할 때만 추가)
    if (t_date) {
        formData.append('t_date', t_date);
    }
    if (branch) {
        formData.append('branch', branch);
    }
    if (cashflow !== null && cashflow !== undefined) {
        formData.append('cashflow', cashflow);
    }
    if (description) {
        formData.append('description', description);
    }
    if (receiptFile) {
        formData.append("receipt", receiptFile);
    }

    try {
        // Fetch API로 PUT 요청 전송
        const url = `${BASIC_URL}/db/modify-transaction/`;
        const response = await fetch(url, {
            method: 'PUT',
            credentials: 'include',
            body: formData  // FormData 객체 전송
        });

        // 응답이 성공적이지 않은 경우 에러 처리
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        // 서버 응답 처리
        const data = await response.json();
        console.log("Transaction updated successfully:", data);
        return data;

    } catch (error) {
        console.error("Error updating transaction:", error);
    }
}

// Retrieves multiple receipt images based on the file paths
export async function api_get_receipt_image_multiple2(tid_list) {
    const url = new URL(`${BASIC_URL}/db/get-receipt-multiple/`);
    
    // file_paths 배열을 쿼리 파라미터로 추가
    tid_list.forEach(tid => {
        url.searchParams.append('tid_list', tid); // 단일 경로 추가
    });

    const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        console.error('Failed to get receipt images:', response.statusText);
        return {};
    }

    const blob = await response.blob();
    const zip = await JSZip.loadAsync(blob);

    const imageUrls = {};
    // ZIP 파일 내부의 각 파일을 순회하며 처리
    await Promise.all(Object.keys(zip.files).map(async (relativePath) => {
        const zipEntry = zip.files[relativePath];

        // 이미지 파일인지 확인 (여기서는 .jpg, .jpeg, .png 파일만 처리)
        if (/\.(jpg|jpeg|png)$/i.test(zipEntry.name)) {
            // 이미지 파일을 Blob으로 변환
            const fileData = await zipEntry.async("blob");

            // Blob을 ObjectURL로 변환하여 배열에 추가
            const imageUrl = URL.createObjectURL(fileData);
            const tid = relativePath.split('_')[0];
            imageUrls[tid] = imageUrl;
        }
    }));


    // 필요한 경우 imageUrls 배열을 반환하거나 다른 곳에서 사용할 수 있음
    return imageUrls;    
}

// Retrieves multiple receipt image URLs based on the transaction IDs
export async function api_get_receipt_image_multiple(tid_list) {
    const url = new URL(`${BASIC_URL}/db/get-receipt-multiple/`);

    // Add tid_list as query parameters
    tid_list.forEach(tid => {
        url.searchParams.append('tid_list', tid);
    });

    const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        console.error('Failed to get receipt image URLs:', response.statusText);
        return {};
    }

    const image_urls = await response.json();
    
    // Return the mapping of tid to image URLs
    return image_urls;
}

// Deletes a transaction by its ID
export async function api_delete_transaction(tid) {
    const url = new URL(`${BASIC_URL}/db/delete-transaction/`);
    url.searchParams.append('tid', tid);

    const response = await fetch(url, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
    });

    if (response.ok) {
        console.log('Transaction deleted successfully');
    } else {
        console.error('Failed to delete transaction:', response.statusText);
    }
}
