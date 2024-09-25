// src/libs/api_user.js

const BASIC_URL = process.env.NEXT_PUBLIC_BASIC_URL;

// Sign in with email and password
export async function api_signin(email, password) {
    try {
        const url = `${BASIC_URL}/user/signin/`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
  
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to sign in.');
        }
  
        const data = await response.json();
        // data.message contains id_token, email, name
        const { id_token, email: userEmail, name } = data.message;
  
        // Store authentication token in localStorage (ensure security)
        localStorage.setItem('idToken', id_token);

        // Return user details if needed
        return { id_token, userEmail, name };
    } catch (error) {
        console.error('Sign-in error:', error);
        alert(error.message);
        return null;
    }
}

// Sign out user
export async function api_signout() {
    try {
        const id_token = localStorage.getItem('idToken');
        const url = `${BASIC_URL}/user/signout/`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${id_token}` },
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.log("Error", errorData);
            alert(errorData.detail || 'Failed to sign out');
            return false;
        }

        localStorage.removeItem('idToken');
        alert("Successfully signed out");
        return true;
    } catch (error) {
        console.error('api_signout error:', error);
        alert(error.message);
        return false;
    }
}

// Sign up a new user
export async function api_signup(email, password, username) {
    try {
        const url = `${BASIC_URL}/user/signup2/`;
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

// Check if the email is available for signup
export async function api_possible_signup(email) {
    try {
        const url = `${BASIC_URL}/user/check-user-exist2?email=${encodeURIComponent(email)}`;
        const response = await fetch(url, {
            method: 'GET',
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to check user existence');
        }

        const data = await response.json();
        return { "status": data == true, "message": data == true ? "Email is available for signup" : "Email already exists" };
    } catch (error) {
        console.error('api_possible_signup error:', error);
        alert(error.message);
        return { "status": false, "message": error.message };
    }
}

// Check verification code for email
export async function api_check_verify(email, code) {
    try {
        const body = { email, code };
        const url = `${BASIC_URL}/user/check-verify-code/`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
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
    try {
        const url = `${BASIC_URL}/user/verify-email/`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to send verification code');
        }

        const data = await response.json();
        return { "message": "Code sent successfully" };
    } catch (error) {
        console.error('api_send_verify_code error:', error);
        alert(error.message);
        return { "message": "Failed to send verification code" };
    }
}

// Send password reset email
export async function api_modify_password(email) {
    try {
        const url = `${BASIC_URL}/user/modify-password-email?email=${encodeURIComponent(email)}`;
        const response = await fetch(url, {
            method: 'GET',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to send password reset email');
        }
        const data = await response.json();
        console.log("Success", data);
        return "Success";
    } catch (error) {
        return null;
    }
}

// Withdraw user account
export async function api_withdraw() {
    try {
        const id_token = localStorage.getItem('idToken');
        const url = `${BASIC_URL}/user/withdraw/`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${id_token}` },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to withdraw');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('api_withdrawal error:', error);
        alert(error.message);
        return null;
    }
}

// Get user information
export async function api_get_user_info() {
    try {
        const id_token = localStorage.getItem('idToken');
        const url = `${BASIC_URL}/user/user-info/`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${id_token}` },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log("Error", errorData);
            return null;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('api_get_user_info error:', error);
        return null;
    }
}

// Update user information
export async function api_update_userinfo(username, useai) {
    try {
        const id_token = localStorage.getItem('idToken');
        const url = `${BASIC_URL}/user/update-userinfo/`;
        const body = { username, useai };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${id_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
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
