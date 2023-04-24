async function main() {
  const parser = new DOMParser();
  const response = await fetch('svgassets/discordlogo.svg');
  const svgText = await response.text();
  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
  const svg = svgDoc.querySelector('svg');
  const loginButton = document.querySelector('#loginbutton');
  const leaderboardButton = document.querySelector('#leaderboard');
  loginButton.appendChild(svg);
  loginButton.addEventListener('click', () => {
    window.location.href = 'https://discord.com/api/oauth2/authorize?client_id=1081759068500283522&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fpets&response_type=token&scope=identify';
  });
  leaderboardButton.addEventListener('click', () => {
    window.location.href = 'http://localhost:8080/leaderboard';
  });
}

window.addEventListener('load', main);
