getData();
async function getData(){
    const response = await fetch('/api');
    const data = await response.json();
    
    for (item of data){
        L.marker([item.lat,item.lon]).addTo(mymap);
        /*
        const root = document.createElement('div');//make a div
        root.setAttribute("id", "root1");
        const geo = document.createElement('div');//make a div
        const date = document.createElement('div');
        const dateString = new Date(item.timestamp).toLocaleString();

        geo.textContent = `Latitude: ${item.lat}°, Longitude: ${item.lon}°`;
        date.textContent = dateString;
        root.append(geo, date);  
        document.body.append(root);*/
    }
    console.log(data);
}