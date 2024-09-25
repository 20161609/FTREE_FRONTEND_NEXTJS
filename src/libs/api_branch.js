// src/libs/api_branch.js

const BASIC_URL = process.env.NEXT_PUBLIC_BASIC_URL;

// Fetches the tree structure of branches from the server
export async function api_get_tree() {
    try {
        const id_token = localStorage.getItem('idToken');
        if (!id_token) {
            throw new Error('Login is required.');
        }

        const url = `${BASIC_URL}/db/get-tree`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {'Authorization': `Bearer ${id_token}`}
        });
  
        if (!response.ok) {
          // Extract error message returned from the server
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to log in.');
        }
  
        const data = await response.json();
        const branch_dict = {};
        for (let i = 0; i < data.length; i++) {
            branch_dict[data[i].path] = data[i].bid;
        }

        const tree = {
            'Home': {
                children: {}, 
                bid: branch_dict['Home'], 
                parentId: null, 
                path: 'Home'
            }
        };

        for (let i = 0; i < data.length; i++) {
            const path = data[i].path.split('/');
            let cur = tree['Home'];
            let parentId = branch_dict['Home'];
            let curPath = 'Home';
            
            for (let j = 1; j < path.length; j++) {
                curPath = curPath + '/' + path[j];
                const branchId = branch_dict[curPath];
                if (!cur.children[path[j]]) {
                    cur.children[path[j]] = {
                        children: {},
                        parentId: parentId,
                        bid: branchId,
                        path: curPath
                    };
                }
                parentId = branchId;
                cur = cur.children[path[j]];
            }
        }
        return tree;
    } catch (error) {
      alert(error.message);

      return null;
    }
}

// Creates a new branch in the specified branch path
export async function api_mkdir(branch_path, child_name) {
    const id_token = localStorage.getItem('idToken');
    if (!id_token) {
        throw new Error('Login is required.');
    }
    const url = `${BASIC_URL}/db/create-branch/`;
    const body = { "branch": branch_path, "child_name": child_name };
    const headers = {
        'Authorization': `Bearer ${id_token}`,
        "Content-Type": "application/json"
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to log in.');
    }
}

// Deletes a branch in the specified branch path
export async function api_rmdir(branch_path) {
    const id_token = localStorage.getItem('idToken');
    if (!id_token) {
        throw new Error('Login is required.');
    }

    const url = `${BASIC_URL}/db/delete-branch/`;
    const headers = {
        'Authorization': `Bearer ${id_token}`, 
        "Content-Type": "application/json"
    };
    const body = { "branch": branch_path };
    const response = await fetch(url, {
        method: 'DELETE',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to log in.');
    }

    alert('Branch deleted successfully.');
}
