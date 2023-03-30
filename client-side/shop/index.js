const accountId = window.location.pathname.slice(-18);

function loadShop() {
    const payload = fetch('http://localhost:8080/shop/' + accountId);
    const items = payload.items;
    const account = payload.account;
    console.log(account);
    console.log(items);
}


async function main(){
   loadShop();
}
window.addEventListener("load", main);

