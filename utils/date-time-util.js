function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}

const formatDateTime = function formatDatetime(datetime) {
    return (
        [
            padTo2Digits(datetime.getDate()),
            padTo2Digits(datetime.getMonth() + 1),
            datetime.getFullYear(),
        ].join('/') +
        ' ' +
        [
            padTo2Digits(datetime.getHours()),
            padTo2Digits(datetime.getMinutes()),
            padTo2Digits(datetime.getSeconds()),
        ].join(':')
    );
}

module.exports = {
    formatDateTime
}