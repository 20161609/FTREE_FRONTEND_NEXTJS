// src/libs/branch_controller.js

// Transforms a tree object into a hierarchical structure suitable for use in UI components
export function transformTree(tree, branch_dict) {
  const tree_form = {
      id: branch_dict['Home'],
      name: 'Home',
      parentId: null,
      children: []
  };
  let node_form = tree_form;
  let node = tree['Home'];
  let path = 'Home';

  const queue = [[node_form, node, path]];
  while (queue.length > 0) {
      let [node_form, node, path] = queue.shift();

      for (let child_name in node) {
          const child_path = path + '/' + child_name;
          const child_id = branch_dict[child_path];
          const child_node = node[child_name];
          const child_form = {
              id: child_id,
              name: child_name,
              parentId: node_form.id,
              children: []
          };
          
          node_form.children.push(child_form);
          queue.push([child_form, child_node, child_path]);
      }
  }
  return [tree_form];
}

// Converts a tree structure into an array format for easier manipulation
export function transformTreeToArray(tree, branch_dict) {    
  let branchArray = [];
  let idCounter = 1;

  // Recursively traverses the tree and converts it to an array
  function traverseTree(node, parentId = null, path = "") {
      for (let key in node) {
          const fullPath = path ? `${path}/${key}` : key;
          const branchId = branch_dict[fullPath] || idCounter++;
          
          const branch = {
              id: branchId,
              name: key,
              parentId: parentId,
              children: []
          };

          branchArray.push(branch);

          // If children exist, call the function recursively
          if (Object.keys(node[key]).length > 0) {
              traverseTree(node[key], branchId, fullPath);
          }
      }
  }

  // Start from the root of the tree
  traverseTree(tree);

  // Populate the children array for each branch
  branchArray.forEach(branch => {
      branch.children = branchArray.filter(b => b.parentId === branch.id).map(b => b.id);
  });

  return branchArray;
}
