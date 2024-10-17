import { player } from './main';

function isMobile(): boolean {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(
    navigator.userAgent
  );
}

if (isMobile()) {
  const joystickArea = document.getElementById('joystick-area');
  const joystick = document.getElementById('joystick');
  let isDragging: boolean = false;
  let centerX: number, centerY: number;

  function updateJoystickPosition(clientX: number, clientY: number) {
    const rect = joystickArea!.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

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

  function startDrag(clientX: number, clientY: number) {
    isDragging = true;
    centerX = joystickArea!.clientWidth / 2;
    centerY = joystickArea!.clientHeight / 2;
    updateJoystickPosition(clientX, clientY);
  }

  function stopDrag() {
    isDragging = false;
    joystick!.style.left = '50%';
    joystick!.style.top = '50%';
    joystick!.style.transform = 'translate(-50%, -50%)';
    player.onKeyUp({ code: 'KeyW', repeat: false });
    player.onKeyUp({ code: 'KeyA', repeat: false });
    player.onKeyUp({ code: 'KeyS', repeat: false });
    player.onKeyUp({ code: 'KeyD', repeat: false });
  }

  // Mouse events
  joystickArea!.addEventListener('mousedown', (e) =>
    startDrag(e.clientX, e.clientY)
  );
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      updateJoystickPosition(e.clientX, e.clientY);
    }
  });
  document.addEventListener('mouseup', stopDrag);

  // Touch events
  joystickArea!.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrag(e.touches[0].clientX, e.touches[0].clientY);
  });
  document.addEventListener('touchmove', (e) => {
    if (isDragging) {
      e.preventDefault();
      updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  });
  document.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopDrag();
  });
} else {
  (document.querySelector('#joystick-container') as any).style.display = 'none';
}
