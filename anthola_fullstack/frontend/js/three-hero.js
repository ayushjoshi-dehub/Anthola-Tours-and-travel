// Lightweight Three.js hero background. Requires three.min.js loaded globally.
export function initThreeHero(){
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.THREE) return;

  const renderer = new window.THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const scene = new window.THREE.Scene();
  const camera = new window.THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 6;

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || 420;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);

  const group = new window.THREE.Group();
  scene.add(group);

  const geom = new window.THREE.IcosahedronGeometry(1.7, 1);
  const mat = new window.THREE.MeshStandardMaterial({
    color: 0x2563eb,
    roughness: 0.6,
    metalness: 0.2,
    transparent: true,
    opacity: 0.24
  });
  const orb = new window.THREE.Mesh(geom, mat);
  group.add(orb);

  const wire = new window.THREE.LineSegments(
    new window.THREE.WireframeGeometry(geom),
    new window.THREE.LineBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.20 })
  );
  group.add(wire);

  const light1 = new window.THREE.PointLight(0xffffff, 1.2);
  light1.position.set(5, 5, 5);
  scene.add(light1);
  scene.add(new window.THREE.AmbientLight(0xffffff, 0.65));

  let t = 0;
  const animate = () => {
    t += 0.01;
    group.rotation.y += 0.003;
    group.rotation.x = Math.sin(t) * 0.08;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  // initial
  resize();
  animate();
}
