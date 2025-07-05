  const { agnes } = require('ml-hclust');
  const csv = require('csv-parser');
  const fs = require('fs');
  const moment = require('moment');

  // Function to save object to JSON file
  function saveObjectToFile(obj, filename) {
    fs.writeFileSync(filename, JSON.stringify(obj, null, 2));
  }

  function transformObject(obj, keylist, depth = 0, totalDepth = 0) {
    if (!keylist) keylist = {};

    if (Array.isArray(obj)) {
      return obj.map(child => transformObject(child, keylist, depth, totalDepth)).filter(child => Object.keys(child).length > 0);
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj = {};
      for (const key in obj) {
        if (key === 'children') {
          const transformedChildren = transformObject(obj.children, keylist, depth + 1, totalDepth);
          if (transformedChildren.length > 0) newObj.children = transformedChildren;
        } else if (key === 'index' && obj[key] !== -1) {
          newObj.key = keylist[obj[key]] ? keylist[obj[key]] : key + "list[" + obj[key] + "]";
          newObj.length = depth === totalDepth ? 5 : (obj.length <= 0 ? 2 : obj.length); // Set length to 5 for the highest hierarchy, otherwise check for negative or zero length
        } else if (key === 'height') {
          newObj.length = 1 + (Object.keys(obj).length - depth) * 2;
        } else if (key !== 'size' && key !== 'isLeaf' && obj[key] !== -1) {
          newObj[key] = transformObject(obj[key], keylist, depth, totalDepth);
        }
      }
      if (depth === 0) newObj.totalLength = 5; // Set totalLength for the highest hierarchy
      return newObj;
    } else {
      return obj;
    }
  }

  function updateDepth(obj, keylist, depth = 0) {
    let maxDepth = 0;

    function traverse(obj, currentDepth) {
      if (Array.isArray(obj)) {
        obj.forEach(child => traverse(child, currentDepth));
      } else if (typeof obj === 'object' && obj !== null) {
        maxDepth = Math.max(maxDepth, currentDepth);
        for (const key in obj) {
          if (key === 'children') {
            traverse(obj.children, currentDepth + 1);
          } else if (key !== 'size' && key !== 'isLeaf' && obj[key] !== -1) {
            traverse(obj[key], currentDepth);
          }
        }
      }
    }

    traverse(obj, 0);

    // console.log(maxDepth);

    function updateLength(obj, currentDepth) {
      if (Array.isArray(obj)) {
        obj.forEach(child => updateLength(child, currentDepth));
      } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (key === 'length') {
            obj.length = 1 + (maxDepth - currentDepth);
            // obj.length = 5 + obj.length;
          } else if (key === 'children') {
            updateLength(obj.children, currentDepth + 1);
          } else if (key !== 'size' && key !== 'isLeaf' && obj[key] !== -1) {
            updateLength(obj[key], currentDepth);
          }
        }
      }
    }

    updateLength(obj, 0);

    obj.totalLength = obj.length;

    return obj;
  }

  function updateLeafLengths(obj, maxDepth, currentDepth = 0) {
    function traverse(obj, currentDepth) {
      if (Array.isArray(obj)) {
        obj.forEach(child => traverse(child, currentDepth));
      } else if (typeof obj === 'object' && obj !== null) {
        if (!obj.children) {
          // console.log(obj.length);
          obj.length += 10;
          // console.log(obj.length);
        } else {
          for (const key in obj) {
            if (key === 'children') {
              traverse(obj.children, currentDepth + 1);
            }
          }
        }
      }
    }
    traverse(obj, currentDepth);

    return obj;
  }

  function transposeMatrix(matrix) {
    return matrix[0].map((col, i) => matrix.map(row => row[i]));
  }

  // Read data from CSV file
  date_selected = '2017-01'
  const data = [];
  fs.createReadStream('FinalDatabase_updated.csv')
    .pipe(csv())
    .on('data', (row) => {
      data.push(row);
    })
    .on('end', () => {
      // Filter data for dates starting from "2018-11"
      const filteredData = data.filter(row => row['Release_date'].startsWith(date_selected));

      // Extract unique countries and genres
      const countries = [...new Set(filteredData.map(d => d.Country))];
      const genres = [
        'dance pop', 'latin', 'pop', 'k-pop', 'n-a', 'german hip hop',
        'atl hip hop', 'francoton', 'dutch hip hop', 'big room', 'hip hop',
        'canadian hip hop', 'emo rap', 'french hip hop', 'finnish dance pop',
        'melodic rap', 'boy band', 'italian hip hop', 'alternative metal',
        'canadian pop', 'modern rock', 'chicago rap', 'deep german hip hop',
        'colombian pop', 'conscious hip hop', 'adult standards', 'detroit hip hop',
        'alternative r&b', 'electropop', 'canadian contemporary r&b', 'edm',
        'art pop', 'polish hip hop', 'dfw rap', 'mandopop', 'danish hip hop', 'rap'
      ];

      // Initialize matrix with zeros
      const matrix = [];

      // Calculate percentage of songs for each country-genre combination
      countries.forEach(country => {
        const countryData = [];
        genres.forEach(genre => {
          const totalSongs = filteredData.filter(row => row.Country === country && row.Genre === genre).length;
          const percentage = (totalSongs / filteredData.length) * 100;
          countryData.push(percentage);
        });
        matrix.push(countryData);
      });


      const tree = agnes(matrix, {
        method: 'ward'
      });

      // console.log(tree.indices());
      newObj = transformObject(tree, countries);
      finalOb = updateDepth(newObj, countries);
      finalObj = updateLeafLengths(finalOb, newObj.length);
      // console.log(JSON.stringify(finalObj, null, 2));
      saveObjectToFile(finalObj, './clusters/' + date_selected + '-countries');

      const transposedMatrix = transposeMatrix(matrix);
      const tree2 = agnes(transposedMatrix, {
        method: 'ward'
      });

      newObj = transformObject(tree2, genres);
      finalOb = updateDepth(newObj, genres);
      finalObj = updateLeafLengths(finalOb, newObj.length);
      // console.log(JSON.stringify(finalObj, null, 2));
      saveObjectToFile(finalObj, './clusters/' + date_selected + '-genres');

    });
