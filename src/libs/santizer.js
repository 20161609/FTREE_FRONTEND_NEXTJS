// src/libs/santizer.js

// Example 100000 -> 100,000
export function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function isValidPassword(password) {
  // Condition 1: The password must be at least 8 characters long.
  if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
  }

  // Condition 2: The password must contain at least one lowercase letter.
  if (!/[a-z]/.test(password)) {
      throw new Error("Password must contain at least one lowercase letter.");
  }

  // Condition 3: Special characters allowed: !@#$%^&*-+
  const validSymbols = "!@#$%^&*-+";
  for (let i = 0; i < password.length; i++) {
      const char = password[i];
      if (!/[a-zA-Z0-9]/.test(char) && !validSymbols.includes(char)) {
          throw new Error("Special characters allowed: !@#$%^&*-+");
      }
  }

  // Condition 4: The password must contain at least one number.
  if (!/[0-9]/.test(password)) {
      throw new Error("Password must contain at least one number.");
  }

  return true;
}

export function getParentPath(path) {
  const pathList = path.split('/');

  if(pathList.length > 1){ 
    pathList.pop();;
  }else{
    return path;
  }
  return pathList.join('/');
}