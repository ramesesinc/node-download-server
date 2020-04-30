
const flattenObject = obj => {
	var newObj = {};
	
	for (const key in obj) {
		if (!obj.hasOwnProperty(key)) continue;
		
		if ((typeof obj[key]) == 'object') {
			var flatObject = flattenObject(obj[key]);
			for (const newKey in flatObject) {
				if (!flatObject.hasOwnProperty(newKey)) continue;
				
				newObj[key + '.' + newKey] = flatObject[newKey];
			}
		} else {
			newObj[key] = obj[key];
		}
	}
	return newObj;
};


module.exports = {
  flattenObject : flattenObject
}