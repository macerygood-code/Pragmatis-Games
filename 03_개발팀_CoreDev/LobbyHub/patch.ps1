$path = "d:\프라그마티스 게임즈\03_개발팀_CoreDev\LobbyHub\PragmatisGames.html"
$content = Get-Content -Path $path -Raw -Encoding UTF8

# 1. launchGame 함수에서 외부 게임 실행 시 HUD 숨기기
$oldLaunch = "scoreBoard.style.visibility = 'hidden'; // 외부 게임 점수는 내부 연동 전까지 숨김
            livesBoard.style.visibility = 'hidden';
            iframe.src = game.file;"
$newLaunch = "const hud = document.getElementById('hud');
            if (hud) hud.style.display = 'none'; // 외부 게임은 자체 HUD를 사용하므로 포털 HUD 숨김
            iframe.src = game.file;"

# 2. 메시지 리스너에서 backToLobby 처리 및 HUD 복구
$oldMessage = "if (event.data === 'close-game') {
            gameModal.classList.remove('active');
            gameFrame.src = ''; 
        }"
$newMessage = "if (event.data === 'close-game' || event.data === 'backToLobby') {
            if (typeof exitToLobby === 'function') {
                exitToLobby();
            } else {
                document.getElementById('game-wrapper').style.display = 'none';
                document.getElementById('lobby-wrapper').style.display = 'block';
                document.getElementById('gameIframe').src = '';
            }
            const hud = document.getElementById('hud');
            if (hud) hud.style.display = 'flex'; // 메인 복귀 시 HUD 복구
        }"

$content = $content.Replace($oldLaunch, $newLaunch)
$content = $content.Replace($oldMessage, $newMessage)

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "Patch applied successfully to PragmatisGames.html"
