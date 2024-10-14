// src/libs/api_branch.js

const BASIC_URL = process.env.NEXT_PUBLIC_BASIC_URL;

// Fetches the tree structure of branches from the server
export async function api_get_tree() {
    console.log("api_get_tree");
    const url = `${NEXT_PUBLIC_BASIC_URL}/db/get-tree/`;
    console.log('beginA', url);
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {'Content-type': 'application/json'},
            credentials: 'include',
        });
  
        if (!response.ok) {
          // Extract error message returned from the server
        //   const errorData = await response.json();
          const errorData = 'await response.json();';
          console.log(response);
          return {
            'Home': {
                children: {}, 
                bid: 1,
                parentId: null,
                path: 'Home'
            }
          }
          throw new Error(errorData.detail || 'Failed to log in.');
        }
  
        const body = await response.json();
        const data = body.message;
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
        // alert(error.message);
        console.log(error);
        const atc = {
            'Home': {
                children: {}, 
                bid: 1,
                parentId: null, 
                path: 'Home'
            }
        };
        return atc;
    }
}

// Creates a new branch in the specified branch path
export async function api_mkdir(branch_path, child_name) {
    const url = `${BASIC_URL}/db/create-branch/`;
    const body = { "parent": branch_path, "child": child_name };
    const response = await fetch(url, {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
        credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to log in.');
    }
}

// Deletes a branch in the specified branch path
export async function api_rmdir(branch_path) {
    const url = new URL(`${BASIC_URL}/db/delete-branch/`);
    // file_paths 배열을 쿼리 파라미터로 추가
    url.searchParams.append('branch', branch_path); // 단일 경로 추가
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {"Content-Type": "application/json"},
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to log in.');
    }

    alert('Branch deleted successfully.');
}
