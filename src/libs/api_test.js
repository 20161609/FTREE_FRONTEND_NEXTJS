// src/libs/api_test.js

const BASIC_URL = process.env.NEXT_PUBLIC_BASIC_URL;

// basic test
export async function api_test() {
    try {
        const url = new URL(`${BASIC_URL}`);
        const response = await fetch(url, {
            method: 'GET',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to call api_test');
        }

        return await response.json();
    } catch (error) {
        console.error('api_test error:', error);
        return false;
    }
}

// receipt OCR test
export async function api_test_receipt(file) {
    try {
        if (!file) {
            throw new Error('No file provided');
        }

        const formData = new FormData();
        formData.append('receipt', file);

        const response = await fetch(`${BASIC_URL}/test/test-receipt`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            let errorMessage = 'Failed to analyze receipt';

            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch {
                // ignore json parse error
            }

            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error('api_test_receipt error:', error);
        return false;
    }
}