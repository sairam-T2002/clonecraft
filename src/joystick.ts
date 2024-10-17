import { player } from './main';
function isMobile(): boolean {
  // Regular expression to match common mobile user agents
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(
    navigator.userAgent
  );
}
if (isMobile()) {
  const joystickArea = document.getElementById('joystick-area');
  const joystick = document.getElementById('joystick');
  let isDragging: boolean = false;
  let centerX: number, centerY: number;

  function updateJoystickPosition(e: any) {
    const rect = joystickArea!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance =
      joystickArea!.clientWidth / 2 - joystick!.clientWidth / 2;

    let finalX, finalY;
    if (distance > maxDistance) {
      const angle = Math.atan2(dy, dx);
      finalX = centerX + maxDistance * Math.cos(angle);
      finalY = centerY + maxDistance * Math.sin(angle);
    } else {
      finalX = x;
      finalY = y;
    }

    joystick!.style.left = `${finalX}px`;
    joystick!.style.top = `${finalY}px`;

    // Calculate displacement from center
    const displacementX = (finalX - centerX) / maxDistance;
    const displacementY = (centerY - finalY) / maxDistance; // Invert Y for intuitive up/down

    // Log the displacement
    console.log(
      `Joystick Position - X: ${displacementX.toFixed(
        2
      )}, Y: ${displacementY.toFixed(2)}`
    );
    console.log(player.velocity);
    player.onKeyDown({
      code: displacementY > 0 ? 'KeyW' : 'KeyS',
      repeat: false,
    });
    player.onKeyDown({
      code: displacementX > 0 ? 'KeyD' : 'KeyA',
      repeat: false,
    });
  }

  joystickArea!.addEventListener('mousedown', (e) => {
    isDragging = true;
    centerX = joystickArea!.clientWidth / 2;
    centerY = joystickArea!.clientHeight / 2;
    updateJoystickPosition(e);
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      updateJoystickPosition(e);
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    joystick!.style.left = '50%';
    joystick!.style.top = '50%';
    joystick!.style.transform = 'translate(-50%, -50%)';
    player.onKeyUp({ code: 'KeyW', repeat: false });
    player.onKeyUp({ code: 'KeyA', repeat: false });
    player.onKeyUp({ code: 'KeyS', repeat: false });
    player.onKeyUp({ code: 'KeyD', repeat: false });
  });
} else {
  (document.querySelector('#joystick-container') as any).style.display = 'none';
}
