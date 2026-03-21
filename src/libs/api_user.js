// src/libs/api_user.js

const BASIC_URL = process.env.NEXT_PUBLIC_BASIC_URL;

// Check verification code for email
export async function api_check_verify(email, code) {
    try {
        const url = new URL(`${BASIC_URL}/auth/verify-email/`);
        url.searchParams.append('email', email);
        url.searchParams.append('code', code);
    
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to verify the code');
        }

        const data = await response.json();
        console.log(data);
        return true;
    } catch (error) {
        console.error('api_check_verify error:', error);
        alert(error.message);
        return false;
    }
}

// Send verification code to email
export async function api_send_verify_code(email) {
    console.log("BASIC_URL:", BASIC_URL);

    const url = `${BASIC_URL}/auth/verify-email/`;
    let response;

    // 1) Stage: get `fetch`
    try {
        response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
    } catch (error) {
        console.error("api_send_verify_code - fetch error:", error);
        alert("Network error while calling verify-email");
        return 404;
    }

    // 2) check the HTTP code's state.
    if (!response.ok) {        
        try {
            const errorBody = await response.json();
            console.error(
                "api_send_verify_code - bad status:",
                response.status,
                "body:",
                errorBody
            );
        } catch (parseError) {
            console.error(
                "api_send_verify_code - bad status, but JSON parse failed:",
                response.status,
                parseError
            );
        }
        return response.status;
    }

    // 3) JSON Parsing (If success!)
    let data;
    try {
        data = await response.json();
    } catch (error) {
        console.error("api_send_verify_code - response.json() error:", error);
        alert("Failed to parse server response");
        return response.status;
    }

    // 4) Finally it's been compelete
    // console.log("api_send_verify_code - success:", data);
    return response.status;
}


// Sign up a new user
export async function api_signup(email, password, username) {
    try {
        const url = `${BASIC_URL}/auth/signup/`;
        const body = { email, password, username };
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        alert("Successfully signed up");
        return true;
    } catch (error) {
        console.error('api_signup error:', error);
        alert(error.message);
        return false;
    }
}

// Sign in with email and password
export async function api_signin(email, password) {
    const url = `${BASIC_URL}/auth/signin/`;

    try {
        console.log("[1] Sending signin request to:", url);

        // 1) FETCH 요청 자체가 실패하는지 확인
        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
        } catch (fetchErr) {
            console.error("[FETCH ERROR] fetch() 자체가 실패함:", fetchErr);
            throw new Error("Fetch 단계에서 실패함 (CORS / 네트워크 문제 가능)");
        }

        console.log("[2] Response received:", response);

        // 2) status 코드로 실패인지 확인
        if (!response.ok) {
            console.log("[STATUS ERROR] response.ok = false, status:", response.status);

            let errorData;
            try {
                errorData = await response.json();
            } catch (jsonErr) {
                console.error("[JSON PARSE ERROR in error response]", jsonErr);
                throw new Error(`Status ${response.status} but error JSON 파싱 실패`);
            }

            console.error("[SERVER ERROR MESSAGE]", errorData);
            throw new Error(errorData.detail || `Status ${response.status}`);
        }

        // 3) JSON 파싱이 문제인지 확인
        let data; 
        try {
            data = await response.json();
        } catch (jsonErr) {
            console.error("[JSON PARSE ERROR in success response]", jsonErr);
            throw new Error("Response JSON 파싱에서 실패함");
        }

        console.log("[3] Parsed JSON:", data);

        // 정상 처리
        const userEmail = data.message?.email;
        const userName = data.message?.username;
        localStorage.setItem('access_token', data.access_token);

        return { userEmail, userName };

    } catch (error) {
        console.error('[FINAL SIGN-IN ERROR]', error);
        alert(error.message);
        return null;
    }
}

// Sign out user
export async function api_signout() {
    try {
        const url = `${BASIC_URL}/auth/signout/`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.log("Error", errorData);
            alert(errorData.detail || 'Failed to sign out');
            return false;
        }

        alert("Successfully signed out");
        return true;
    } catch (error) {
        console.error('api_signout error:', error);
        alert(error.message);
        return false;
    }
}

// Send password reset email
export async function api_modify_password(password) {
    try {
        const formData = new FormData();
        formData.append('password', password);

        const url = `${BASIC_URL}/auth/modify-password/`;
        const response = await fetch(url, {
            method: 'PUT',
            credentials: 'include',
            body: formData,
        });



        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to send password reset email');
        }
        const data = await response.json();
        console.log("Success", data);
        return "Success";
    } catch (error) {
        throw new Error(error.message);
        // return null;
    }
}

// Delete user Account
export async function api_delete_account() {
    try {
        const url = `${BASIC_URL}/auth/delete-account/`;
        const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to delete account');
        }

        const data = await response.json();
        console.log(data);
        return true;
    } catch (error) {
        console.error('api_delete_account error:', error);
        alert(error.message);
        return false;
    }
}

// Get user information
export async function api_get_user_info() {
    try {
        const url = `${BASIC_URL}/auth/get-user/`;

        // 🔥 1) localStorage에서 access_token 꺼냄
        const token = localStorage.getItem("access_token");
        if (!token) {
            console.log("No access token in localStorage");
            return null;
        }

        // 🔥 2) Authorization 헤더 붙여서 요청
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // 🔥 3) 인증 실패
        if (!response.ok) {
            let error = null;
            try {
                error = await response.json();
            } catch (e) {}
            console.log("Error:", error);
            return null;
        }

        // 🔥 4) 성공 → JSON 파싱 후 반환
        const body = await response.json();
        return body.message;

    } catch (error) {
        console.error("api_get_user_info error:", error);
        return null;
    }
}



// Update user information
export async function api_update_userinfo(username, useai, displayCurrency) {
    try {
        const url = `${BASIC_URL}/auth/update-userinfo/`;
        const formData = new FormData();
        formData.append('username', username);
        formData.append('useai', useai);
        formData.append('display_currency', displayCurrency);

        const token = localStorage.getItem('access_token')
        const response = await fetch(url, {
            method: 'PUT',
            headers: {'Authorization': `Bearer ${token}`}, //,'Content-type': 'application/json'},
            body: formData,
            // credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log("Error", errorData);
            return null;
        }

        const data = await response.json();
        console.log(data);
        alert("Successfully updated");
        return data;
    } catch (error) {
        console.error('api_update_userinfo error:', error);
        alert(error.message);
        return null;
    }
}

// When user forgets password, send email to reset password
export async function api_forget_password(email) {
    try {
        const url = `${BASIC_URL}/auth/forget-password/`;
        const body = { email };
        const token = localStorage.getItem('access_token')
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to send password reset email');
        }

        const data = await response.json();
        console.log(data);
        return true;
    } catch (error) {
        console.error('api_get_user_transactions error:', error);
        alert(error.message);
        return null;
    }
}