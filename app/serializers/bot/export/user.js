const { FORMAT_DATE_TIME } = require('app/config/app');
const moment = require('moment');

module.exports = (type, headers, user) => {
  const createData = headers.map(column => createText[column](type, user));
  const joinData = createData.join('');
  return type === 'pdf' ? joinData : createData ;
};

const createText = {
  'NAME': (type, { first_name, last_name }) => verifyString(type, `${first_name} ${last_name}`),
  'ROLE': (type, { role }) => verifyString(type, role && role.name),
  'EMAIL': (type, { email }) => verifyString(type, email),
  'STATUS': (type, { status }) => verifyString(type, status),
  'CREATED DATE': (type, { createdAt }) => verifyString(type, moment(createdAt).format(FORMAT_DATE_TIME)),
  'CREATED BY': (type, { created_by }) => verifyString(type, created_by ? `${created_by.first_name} ${created_by.last_name}` : '')
};

const verifyString = (type, value) => {
  if (type === 'pdf') {
    return `<td class="string">${value}</td>`;
  }
  return value;
};