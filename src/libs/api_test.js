// src/libs/api_test.js

const BASIC_URL = process.env.NEXT_PUBLIC_BASIC_URL;

// Check verification code for email
export async function api_test() {
    try {
        const url = new URL(`${BASIC_URL}`);
        const response = await fetch(url, {
            method: 'GET',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to verify the code');
        }


        return response.json();
    } catch (error) {
        console.error('api_test error:', error);
        return false;
    }
}

