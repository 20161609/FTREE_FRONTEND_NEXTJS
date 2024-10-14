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
    try {
        const url = `${BASIC_URL}/auth/verify-email/`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            return response.status;
        }

        const data = await response.json();
        console.log(data);
        return response.status;
    } catch (error) {
        console.error('api_send_verify_code error:', error);
        alert(error.message);
        return 404;
    }
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
    try {
        const url = `${BASIC_URL}/auth/signin/`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
        });
  
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to sign in.');
        }
  
        const data = await response.json();
        const access_token = data.message['access_token'];
        const userEmail = data.message['email'];
        const userName = data.message['username'];

        // Store authentication token in localStorage (ensure security)
        // Return user details if needed
        return { access_token, userEmail, userName };
    } catch (error) {
        console.error('Sign-in error:', error);
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
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log("Error", errorData);
            alert(errorData.detail || 'Failed to get user information');
            return null;
        }
        
        const body = await response.json();
        const data = body.message;
        return data;
    } catch (error) {
        return null;
    }
}

// Update user information
export async function api_update_userinfo(username, useai) {
    try {
        const url = `${BASIC_URL}/auth/update-userinfo/`;
        const formData = new FormData();
        formData.append('username', username);
        formData.append('useai', useai);

        const response = await fetch(url, {
            method: 'PUT',
            body: formData,
            credentials: 'include'
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
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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