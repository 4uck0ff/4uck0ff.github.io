import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import {
  GLTFLoader
} from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/RGBELoader.js';




const container = document.getElementById('SceneMainContainer');

const scene = new THREE.Scene();
scene.background = null; // Прозрачный фон

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 5);
camera.lookAt(scene.position);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// 🌄 Загрузка HDRI
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new RGBELoader()
  .setPath('hdr/') // папка рядом с index.html
  .load('studio.hdr', (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    // scene.background = envMap; // можно раскомментировать, если хочешь видеть фон HDRI
    texture.dispose();
    pmremGenerator.dispose();
  });


// 🌞 Свет
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // мягкий рассеянный свет
scene.add(ambientLight);

const directionalLightCold = new THREE.DirectionalLight(0x4fa7ff, 1); // холодный свет
directionalLightCold.position.set(-5, 10, 1);
directionalLightCold.castShadow = true;
scene.add(directionalLightCold);

const directionalLightMain = new THREE.DirectionalLight(0xffffff, 0.3); // основной свет
directionalLightMain.position.set(1, 10, 1);
directionalLightMain.castShadow = true;
scene.add(directionalLightMain);

const directionalLightWarm = new THREE.DirectionalLight(0xffbd87, 1); // теплый свет
directionalLightWarm.position.set(5, 2, 1);
directionalLightWarm.castShadow = true;
scene.add(directionalLightWarm);

// Загрузка моделей
const loader = new GLTFLoader();
// Храним загруженные модели по имени
const loadedModels = {};

const modelNames = ['body', 'button1', 'button2', 'button3', 'button4', 'button5', 'button6', 'button7', 'button8', 'button9', 'button10', 'button11', 'button12', 'screen', 'text1', 'text2', 'text3'];

function loadModel(name, xOffset = 0, onLoadCallback = null) {
  loader.load(
    `3dModels/${name}.glb`,
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);

      loadedModels[name] = model;

      if (onLoadCallback) {
        onLoadCallback(model);
      }
    },
    undefined,
    (error) => {
      console.error(`Ошибка при загрузке ${name}.glb:`, error);
    }
  );
}

// Объект, на который применяем параллакс (можно scene или customGroup)
const parallaxTarget = scene;

// Настройки чувствительности и скорости
const parallaxSettings = {
  maxRotationX: 0.04, // в радианах (~3°)
  maxRotationY: 0.04,
  lerpSpeed: 0.07      // скорость интерполяции
};

const mousePos = { x: 0, y: 0 };        // положение мыши в нормализованных координатах
const targetRotation = { x: 0, y: 0 };  // целевой поворот

// Слушаем движение мыши
window.addEventListener('mousemove', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mousePos.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mousePos.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Рассчитываем целевые значения поворота
  targetRotation.y = mousePos.x * parallaxSettings.maxRotationY;
  targetRotation.x = mousePos.y * parallaxSettings.maxRotationX;
});

function animate() {
  requestAnimationFrame(animate);

  // Интерполяция текущего поворота к целевому
  parallaxTarget.rotation.x += (targetRotation.x - parallaxTarget.rotation.x) * parallaxSettings.lerpSpeed;
  parallaxTarget.rotation.y += (targetRotation.y - parallaxTarget.rotation.y) * parallaxSettings.lerpSpeed;

  renderer.render(scene, camera);
}

animate();

// Адаптация к размеру окна
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// Повернуть модель "button1" на 90 градусов по Y:
function rotateModelY(name, degrees) {
  const model = loadedModels[name];
  if (model) {
    model.rotation.y += THREE.MathUtils.degToRad(degrees);
  } else {
    console.warn(`Модель ${name} ещё не загружена.`);
  }
}

function rotateModelX(name, degrees) {
  const model = loadedModels[name];
  if (model) {
    model.rotation.x += THREE.MathUtils.degToRad(degrees);
  } else {
    console.warn(`Модель ${name} ещё не загружена.`);
  }
}

function rotateModelZ(name, degrees) {
  const model = loadedModels[name];
  if (model) {
    model.rotation.z += THREE.MathUtils.degToRad(degrees);
  } else {
    console.warn(`Модель ${name} ещё не загружена.`);
  }
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Словарь загруженных моделей уже есть: loadedModels
// Добавим новую Map для интерактивных моделей
const interactiveModels = new Map(); // model → { axis: 'z', distance: 1 }
let activeModel = null;

// ✅ Функция для активации интерактивности
function enableClickMove(name, axis = 'z', distance = 1, videoFileName = null) {
  const model = loadedModels[name];
  if (!model) {
    console.warn(`enableClickMove: модель "${name}" ещё не загружена`);
    return;
  }

  const originalPosition = model.position.clone();
  interactiveModels.set(model, {
    axis,
    distance,
    originalPosition,
    moved: false,
    videoFileName, // добавляем сюда имя видео
  });
}


// 🔁 Обработчик клика
renderer.domElement.addEventListener('click', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const models = Array.from(interactiveModels.keys());

  const intersects = raycaster.intersectObjects(models, true);

  if (intersects.length > 0) {
    let object = intersects[0].object;
    while (object && !interactiveModels.has(object)) {
      object = object.parent;
    }

    if (object && interactiveModels.has(object)) {
      const data = interactiveModels.get(object);

      if (data.moved) {
        console.log('🔹 Модель уже активирована, повторный клик не сработает.');
        return;
      }

      // Возврат предыдущей активной модели
      if (activeModel && activeModel !== object) {
        const prevData = interactiveModels.get(activeModel);
        if (prevData) {
          console.log('↩️ Возврат предыдущей модели в исходное положение');
          animateToPosition(activeModel, prevData.originalPosition);
          prevData.moved = false;
        }
      }

      // Сдвиг текущей модели
      moveModelLocal(object, data.axis, data.distance);
      data.moved = true;
      activeModel = object;

      // Если для этой модели задано имя видео — меняем текстуру
      if (data.videoFileName) {
        changeVideoTextureOnPlane(data.videoFileName);
      }
    }
  }
});


function animateToPosition(object, targetPosition) {
  gsap.to(object.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration: 0.5,
    ease: 'power2.out',
    onComplete: () => {
      console.log('🔁 Объект вернулся в исходное положение');
    }
  });
}


// 🚀 Функция анимации сдвига по локальной оси
function moveModelLocal(object, axis = 'z', distance = 1) {
  console.log('moveModelLocal вызвана с:', { object, axis, distance });

  if (!object) {
    console.error('moveModelLocal: объект не передан или undefined');
    return;
  }

  if (!['x', 'y', 'z'].includes(axis)) {
    console.warn(`Некорректный axis: ${axis}. Использую 'z' по умолчанию.`);
    axis = 'z';
  }

  let dirVector;
  try {
    dirVector = new THREE.Vector3(
      axis === 'x' ? 1 : 0,
      axis === 'y' ? 1 : 0,
      axis === 'z' ? 1 : 0
    ).applyQuaternion(object.quaternion);
  } catch (error) {
    console.error('Ошибка при вычислении направления:', error);
    return;
  }

  const start = new THREE.Vector3();
  object.getWorldPosition(start);

  const end = start.clone().addScaledVector(dirVector, distance);

  if (!object.parent) {
    console.warn('Объект не имеет родителя. Сдвиг глобально.');
    gsap.to(object.position, {
      x: object.position.x + (axis === 'x' ? distance : 0),
      y: object.position.y + (axis === 'y' ? distance : 0),
      z: object.position.z + (axis === 'z' ? distance : 0),
      duration: 0.5,
      ease: 'power2.out'
    });
    return;
  }

  let localEnd;
  try {
    localEnd = object.parent.worldToLocal(end.clone());
  } catch (error) {
    console.error('Ошибка при преобразовании мировой позиции в локальную:', error);
    return;
  }

  gsap.to(object.position, {
    x: localEnd.x,
    y: localEnd.y,
    z: localEnd.z,
    duration: 0.5,
    ease: 'power2.out',
    onComplete: () => {
      console.log('Сдвиг завершён');
    }
  });
}

const highlightableModels = new Set(); // только для указанных моделей
let lastHighlighted = null; // последний объект, на который был наведён курсор

function increaseEmissionIntensity(object, delta = 1, duration = 0.5) {
  object.traverse((child) => {
    if (child.isMesh && child.material && 'emissiveIntensity' in child.material) {
      const material = child.material;

      // Сохраняем оригинальное значение, если ещё не сохранено
      if (material.userData.originalEmissiveIntensity === undefined) {
        material.userData.originalEmissiveIntensity = material.emissiveIntensity;
      }

      const target = material.userData.originalEmissiveIntensity + delta;

      gsap.to(material, {
        emissiveIntensity: target,
        duration: duration,
        ease: 'power2.out'
      });
    }
  });
}

function resetEmissionIntensity(object, duration = 0.5) {
  object.traverse((child) => {
    if (child.isMesh && child.material && 'emissiveIntensity' in child.material) {
      const material = child.material;
      const original = material.userData.originalEmissiveIntensity;

      if (original !== undefined) {
        gsap.to(material, {
          emissiveIntensity: original,
          duration: duration,
          ease: 'power2.out'
        });
      }
    }
  });
}

renderer.domElement.addEventListener('mousemove', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const models = Array.from(highlightableModels);
  const intersects = raycaster.intersectObjects(models, true);

  if (intersects.length > 0) {
    const hovered = intersects[0].object;

    let modelGroup = hovered;
    while (modelGroup && !highlightableModels.has(modelGroup)) {
      modelGroup = modelGroup.parent;
    }

    if (modelGroup && modelGroup !== lastHighlighted) {
      if (lastHighlighted) {
        resetEmissionIntensity(lastHighlighted);
      }
      increaseEmissionIntensity(modelGroup, 0.2); // увеличиваем на 1
      lastHighlighted = modelGroup;
    }
  } else {
    if (lastHighlighted) {
      resetEmissionIntensity(lastHighlighted);
      lastHighlighted = null;
    }
  }
});


function applyGlassMaterial(
  modelName,
  baseColor = '#ffffff',
  emissionColor = '#ff4400',
  emissionIntensity = 0.5,
  ior = 1.7,
  roughness = 0.1,
  metalness = 1.0
) {
  const model = loadedModels[modelName];

  if (!model) {
    console.warn(`applyGlassMaterial: модель "${modelName}" не найдена`);
    return;
  }

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(baseColor),
    metalness: metalness,
    roughness: roughness,
    transmission: 1.0, // стеклянный эффект
    ior: ior,
    thickness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 1.0,
    emissive: new THREE.Color(emissionColor),
    emissiveIntensity: emissionIntensity
  });

  model.traverse((child) => {
    if (child.isMesh) {
      child.material = material;
      child.material.needsUpdate = true;
    }
  });


}


function replaceMeshWithVideoPlane(object3D, { file, width = 1, height = 1, x = 0, y = 0, z = 0 }) {
  if (!object3D || !file) {
    console.warn('Нужны параметры: объект и имя файла');
    return;
  }

  // Получаем мировую позицию и ориентацию объекта
  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  object3D.getWorldPosition(worldPosition);
  object3D.getWorldQuaternion(worldQuaternion);

  // Удаляем объект из сцены
  if (object3D.parent) {
    object3D.parent.remove(object3D);
  }

  const video = document.createElement('video');
  video.src = `vids/${file}`;
  video.loop = true;

  // Атрибуты для автозапуска
  video.setAttribute('autoplay', '');
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;

  // Попытка сразу запустить
  video.play().catch(() => {
    console.log('Видео не запустилось — ждёт клика');
  });

  // Гарантированный запуск при клике
  window.addEventListener('click', () => {
    video.play().catch(err => console.warn('Ошибка воспроизведения при клике:', err));
  }, { once: true });

  // Создаём текстуру
  const texture = new THREE.VideoTexture(video);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBAFormat;

  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const geometry = new THREE.PlaneGeometry(width, height);
  const plane = new THREE.Mesh(geometry, material);

  // ✅ Назначаем имя новому объекту
  plane.name = `Screen_videoPlane`;
  console.log(plane.name);

  // Преобразуем смещение из локальных координат в мировые
  const localOffset = new THREE.Vector3(x, y, z).applyQuaternion(worldQuaternion);
  const finalPosition = worldPosition.clone().add(localOffset);

  // Устанавливаем позицию и поворот
  plane.position.copy(finalPosition);
  plane.quaternion.copy(worldQuaternion);

  // Добавляем в сцену
  scene.add(plane);

  return plane;
}

function changeVideoTextureOnPlane(newVideoFileName, fadeDuration = 0.5) {
  const plane = scene.getObjectByName('Screen_videoPlane');
  if (!plane) {
    console.warn('Плоскость "Screen_videoPlane" не найдена.');
    return;
  }

  const oldMaterial = plane.material;

  // Создаём новый video элемент
  const newVideo = document.createElement('video');
  newVideo.src = `./vids/${newVideoFileName}`;
  newVideo.crossOrigin = 'anonymous';
  newVideo.loop = true;
  newVideo.muted = true;
  newVideo.playsInline = true;
  newVideo.autoplay = true;
  newVideo.play();

  const newTexture = new THREE.VideoTexture(newVideo);
  newTexture.minFilter = THREE.LinearFilter;
  newTexture.magFilter = THREE.LinearFilter;
  newTexture.format = THREE.RGBAFormat;

  const newMaterial = new THREE.MeshBasicMaterial({
    map: newTexture,
    transparent: true,
    opacity: 0 // Сначала полностью прозрачный
  });

  // Временная плоскость для плавного перехода
  const tempPlane = new THREE.Mesh(plane.geometry.clone(), newMaterial);
  tempPlane.name = 'Temp_videoPlane';
  tempPlane.position.copy(plane.position);
  tempPlane.rotation.copy(plane.rotation);
  tempPlane.scale.copy(plane.scale);
  plane.parent.add(tempPlane);

  // Анимация затухания старого материала
  gsap.to(oldMaterial, {
    opacity: 0,
    duration: fadeDuration,
    ease: 'power2.out',
    onComplete: () => {
      oldMaterial.dispose();
      plane.material = newMaterial;
      plane.parent.remove(tempPlane);
    }
  });

  // Анимация появления нового материала
  gsap.to(newMaterial, {
    opacity: 1,
    duration: fadeDuration,
    ease: 'power2.out'
  });
}


loadModel('screen', 4, (model) => {
  rotateModelY('screen', -0);
  rotateModelX('screen', -40);
  rotateModelZ('screen', -15);
  replaceMeshWithVideoPlane(model, {
  file: 'blender.mp4',
  width: 1.2,
  height: 1.2,
  x: 0,
  y: 1,
  z: .3
});
  // модель точно загружена
});

loadModel('body', 4, (model) => {
  rotateModelY('body', -0);
  rotateModelX('body', -40);
  rotateModelZ('body', -15);
  // модель точно загружена
});

loadModel('button1', 4, (model) => {
  rotateModelY('button1', -0);
  rotateModelX('button1', -40);
  rotateModelZ('button1', -15);
  enableClickMove('button1', 'z', -0.065, 'blender.mp4');
  highlightableModels.add(model);
  applyGlassMaterial(
  'button1',
  '#ff9233',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  2,        // IOR (преломление)
  0.1,         // roughness
  0.5          // metallic
);

  // модель точно загружена
});

loadModel('button2', 4, (model) => {
  rotateModelY('button2', -0);
  rotateModelX('button2', -40);
  rotateModelZ('button2', -15);
  enableClickMove('button2', 'z', -0.065, 'printer.mp4');
  highlightableModels.add(model);
  applyGlassMaterial(
  'button2',
  '#00ffff',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  1.45,        // IOR (преломление)
  0.2,         // roughness
  0.8          // metallic
);
  // модель точно загружена
});

loadModel('button3', 4, (model) => {
  rotateModelY('button3', -0);
  rotateModelX('button3', -40);
  rotateModelZ('button3', -15);
  enableClickMove('button3', 'z', -0.065);
  highlightableModels.add(model);
  applyGlassMaterial(
  'button3',
  '#00ffff',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  1.45,        // IOR (преломление)
  0.2,         // roughness
  0.8          // metallic
);
  // модель точно загружена
});

loadModel('button4', 4, (model) => {
  rotateModelY('button4', -0);
  rotateModelX('button4', -40);
  rotateModelZ('button4', -15);
  enableClickMove('button4', 'z', -0.065);
  highlightableModels.add(model);
  applyGlassMaterial(
  'button4',
  '#00ffff',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  1.45,        // IOR (преломление)
  0.2,         // roughness
  0.8          // metallic
);
  // модель точно загружена
});

loadModel('button5', 4, (model) => {
  rotateModelY('button5', -0);
  rotateModelX('button5', -40);
  rotateModelZ('button5', -15);
  enableClickMove('button5', 'z', -0.065);
  highlightableModels.add(model);
  applyGlassMaterial(
  'button5',
  '#ff9233',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  2,        // IOR (преломление)
  0.1,         // roughness
  0.5          // metallic
);
  // модель точно загружена
});

loadModel('button6', 4, (model) => {
  rotateModelY('button6', -0);
  rotateModelX('button6', -40);
  rotateModelZ('button6', -15);
  enableClickMove('button6', 'z', -0.065);
  highlightableModels.add(model);
  applyGlassMaterial(
  'button6',
  '#00ffff',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  1.45,        // IOR (преломление)
  0.2,         // roughness
  0.8          // metallic
);
  // модель точно загружена
});

loadModel('button7', 4, (model) => {
  rotateModelY('button7', -0);
  rotateModelX('button7', -40);
  rotateModelZ('button7', -15);
  enableClickMove('button7', 'z', -0.065);
  highlightableModels.add(model);
  applyGlassMaterial(
  'button7',
  '#00ffff',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  1.45,        // IOR (преломление)
  0.2,         // roughness
  0.8          // metallic
);
  // модель точно загружена
});

loadModel('button8', 4, (model) => {
  rotateModelY('button8', -0);
  rotateModelX('button8', -40);
  rotateModelZ('button8', -15);
  enableClickMove('button8', 'z', -0.065);
  highlightableModels.add(model);
  applyGlassMaterial(
  'button8',
  '#00ffff',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  1.45,        // IOR (преломление)
  0.2,         // roughness
  0.8          // metallic
);
  // модель точно загружена
});

loadModel('button9', 4, (model) => {
  rotateModelY('button9', -0);
  rotateModelX('button9', -40);
  rotateModelZ('button9', -15);
  enableClickMove('button9', 'z', -0.065);
  highlightableModels.add(model);
  applyGlassMaterial(
  'button9',
  '#ff9233',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  2,        // IOR (преломление)
  0.1,         // roughness
  0.5          // metallic
);
  // модель точно загружена
});

loadModel('button10', 4, (model) => {
  rotateModelY('button10', -0);
  rotateModelX('button10', -40);
  rotateModelZ('button10', -15);
  enableClickMove('button10', 'z', -0.065);
  highlightableModels.add(model);
  applyGlassMaterial(
  'button10',
  '#00ffff',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  1.45,        // IOR (преломление)
  0.2,         // roughness
  0.8          // metallic
);
  // модель точно загружена
});

loadModel('button11', 4, (model) => {
  rotateModelY('button11', -0);
  rotateModelX('button11', -40);
  rotateModelZ('button11', -15);
  enableClickMove('button11', 'z', -0.065);
  highlightableModels.add(model);
  applyGlassMaterial(
  'button11',
  '#00ffff',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  1.45,        // IOR (преломление)
  0.2,         // roughness
  0.8          // metallic
);
  // модель точно загружена
});

loadModel('button12', 4, (model) => {
  rotateModelY('button12', -0);
  rotateModelX('button12', -40);
  rotateModelZ('button12', -15);
  enableClickMove('button12', 'z', -0.065);
  highlightableModels.add(model);
  applyGlassMaterial(
  'button12',
  '#00ffff',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  1.45,        // IOR (преломление)
  0.2,         // roughness
  0.8          // metallic
);
  // модель точно загружена
});



loadModel('text1', 4, (model) => {
  rotateModelY('text1', -0);
  rotateModelX('text1', -40);
  rotateModelZ('text1', -15);
  applyGlassMaterial(
  'text1',
  'white',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  1.1,        // IOR (преломление)
  0.9,         // roughness
  1          // metallic
);
  // модель точно загружена
});

loadModel('text2', 4, (model) => {
  rotateModelY('text2', -0);
  rotateModelX('text2', -40);
  rotateModelZ('text2', -15);
  applyGlassMaterial(
  'text2',
  'white',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  1.1,        // IOR (преломление)
  0.9,         // roughness
  1          // metallic
);
  // модель точно загружена
});

loadModel('text3', 4, (model) => {
  rotateModelY('text3', -0);
  rotateModelX('text3', -40);
  rotateModelZ('text3', -15);
  applyGlassMaterial(
  'text3',
  'white',   // базовый цвет
  '#ffffff',   // цвет свечения
  0,         // интенсивность свечения
  1.1,        // IOR (преломление)
  0.9,         // roughness
  1          // metallic
);
  // модель точно загружена
});
