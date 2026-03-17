document.addEventListener('DOMContentLoaded', () => {
  const modelViewer = document.querySelector('model-viewer');
  const legendPanel = document.getElementById('legend-panel');
  const legendHeader = document.querySelector('.legend-header');
  const legendContent = document.querySelector('.legend-content');
  const searchInput = document.querySelector('.legend-search');
  const legendItems = document.querySelectorAll('.legend-item');
  const hotspots = document.querySelectorAll('.Hotspot');
  const legendCategories = document.querySelectorAll('.legend-category');

  // --- Legend Collapse ---
  legendHeader.addEventListener('click', () => {
    const isMinimized = legendPanel.classList.toggle('minimized');
    const icon = legendHeader.querySelector('.collapse-btn i');
    icon.classList.toggle('fa-chevron-up', !isMinimized);
    icon.classList.toggle('fa-chevron-down', isMinimized);
  });

  // --- Search ---
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();

    const visibleHotspots = new Set();
    let isSearchEmpty = !query;

    legendItems.forEach(item => {
      const label = item.querySelector('.item-label').textContent.toLowerCase();
      const match = isSearchEmpty || label.includes(query);
      item.style.display = match ? 'flex' : 'none';

      if (match) {
        const category = item.dataset.category;
        const number = item.dataset.number;
        if (category) {
          Array.from(hotspots).forEach(h => {
            const hLabel = h.querySelector('.hotspot-label').textContent;
            if (hLabel === category || (category === 'Exit' && hLabel.includes('Exit')) || (category === 'Stairs' && hLabel.includes('Stairs'))) {
              visibleHotspots.add(h);
            }
          });
        } else if (number) {
          const hotspot = Array.from(hotspots).find(h => h.querySelector('.hotspot-number').textContent === number);
          if (hotspot) visibleHotspots.add(hotspot);
        }
      }
    });

    // Hide/show category titles
    legendCategories.forEach(category => {
      const anyVisible = Array.from(category.querySelectorAll('.legend-item')).some(
        item => item.style.display !== 'none'
      );
      category.style.display = anyVisible ? 'block' : 'none';
    });
    
    // Hide unmatched hotspots
    hotspots.forEach(h => {
      if (isSearchEmpty || visibleHotspots.has(h)) {
        h.classList.remove('search-hidden');
      } else {
        h.classList.add('search-hidden');
      }
    });
  });

  // --- Initialize Exit Hotspots ---
  hotspots.forEach(h => {
    const label = h.querySelector('.hotspot-label');
    if (label && label.textContent.includes('Exit')) {
      h.classList.add('exit-hotspot');
    }
  });

  // --- Eye Toggle ---
  const toggleVisibility = (elements, show) => {
    elements.forEach(el => {
      if (show) {
        el.classList.remove('eye-hidden');
      } else {
        el.classList.add('eye-hidden');
      }
    });
  };

  legendItems.forEach(item => {
    const eyeBtn = item.querySelector('.eye-toggle');
    if (!eyeBtn) return;

    eyeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const icon = eyeBtn.querySelector('i');
      const isCurrentlyVisible = !icon.classList.contains('fa-eye-slash');
      const newVisibleState = !isCurrentlyVisible;
      
      const category = item.dataset.category;
      const number = item.dataset.number;

      if (category) {
        const categoryHotspots = Array.from(hotspots).filter(h => {
          const hLabel = h.querySelector('.hotspot-label').textContent;
          return hLabel === category || (category === 'Exit' && hLabel.includes('Exit')) || (category === 'Stairs' && hLabel.includes('Stairs'));
        });
        toggleVisibility(categoryHotspots, newVisibleState);
      } else if (number) {
        const hotspot = Array.from(hotspots).find(h => h.querySelector('.hotspot-number').textContent === number);
        if (hotspot) {
          toggleVisibility([hotspot], newVisibleState);
        }
      }
      
      if (newVisibleState) {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        eyeBtn.classList.remove('hidden-state');
      } else {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        eyeBtn.classList.add('hidden-state');
      }
    });
  });

  // --- Category Toggle ---
  const categoryHeaders = document.querySelectorAll('.category-header');
  categoryHeaders.forEach(header => {
    const catToggleBtn = header.querySelector('.category-toggle');
    if (!catToggleBtn) return;

    catToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const icon = catToggleBtn.querySelector('i');
      const isCurrentlyVisible = !icon.classList.contains('fa-eye-slash');
      const newVisibleState = !isCurrentlyVisible;

      // Update the category button icon
      if (newVisibleState) {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        catToggleBtn.classList.remove('hidden-state');
      } else {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        catToggleBtn.classList.add('hidden-state');
      }

      // Find all items within this category and toggle them
      const categoryContainer = header.closest('.legend-category');
      const items = categoryContainer.querySelectorAll('.legend-item');
      
      items.forEach(item => {
        const itemEyeBtn = item.querySelector('.eye-toggle');
        const itemIcon = itemEyeBtn.querySelector('i');
        
        // Update individual item icon state
        if (newVisibleState) {
          itemIcon.classList.remove('fa-eye-slash');
          itemIcon.classList.add('fa-eye');
          itemEyeBtn.classList.remove('hidden-state');
        } else {
          itemIcon.classList.remove('fa-eye');
          itemIcon.classList.add('fa-eye-slash');
          itemEyeBtn.classList.add('hidden-state');
        }

        // Toggle map hotspots
        const categoryLabel = item.dataset.category;
        const number = item.dataset.number;

        if (categoryLabel) {
          const categoryHotspots = Array.from(hotspots).filter(h => {
            const hLabel = h.querySelector('.hotspot-label').textContent;
            return hLabel === categoryLabel || (categoryLabel === 'Exit' && hLabel.includes('Exit')) || (categoryLabel === 'Stairs' && hLabel.includes('Stairs'));
          });
          toggleVisibility(categoryHotspots, newVisibleState);
        } else if (number) {
          const hotspot = Array.from(hotspots).find(h => h.querySelector('.hotspot-number').textContent === number);
          if (hotspot) {
            toggleVisibility([hotspot], newVisibleState);
          }
        }
      });
    });
  });

  // --- Hotspot Selection & Camera View ---
  const annotationClicked = (annotation) => {
    let dataset = annotation.dataset;
    
    // Automatically fallback to position for target and keep current orbit if none provided, 
    // ensuring the camera correctly focuses on the clicked room
    if (dataset.target || dataset.position) {
      modelViewer.cameraTarget = dataset.target || dataset.position;
    }
    
    // Update camera orbit if completely specified (though target shifting often handles the main view)
    if (dataset.orbit) {
      modelViewer.cameraOrbit = dataset.orbit;
    } else {
      // If no explicit orbit, zoom in slightly on the target dynamically based on the model's position
      // Using an isometric angle (45deg azimuthal, 45deg polar) instead of 'auto' a.k.a straight-on
      modelViewer.cameraOrbit = '45deg 45deg 35m';
    }
    
    // Set to 45deg as requested
    modelViewer.fieldOfView = '45deg';
  };

  hotspots.forEach(h => {
    h.addEventListener('click', () => {
      hotspots.forEach(other => other.classList.remove('selected'));
      h.classList.add('selected');
      annotationClicked(h);
    });
  });

  // --- Idle Orbit System ---
  let isOrbiting = false;
  let orbitRaf;
  let currentTheta = 0; // The angle

  const originalOrbitStr = modelViewer.cameraOrbit; // capture to revert/reference if needed later
  
  const startIdleOrbit = () => {
    if (isOrbiting) return;
    isOrbiting = true;
    
    // Attempt to base orbit around the 'You Are Here' point, usually the lobby.
    const orbitCenter = document.getElementById('orbit-center');
    if (orbitCenter && orbitCenter.dataset.position) {
        modelViewer.cameraTarget = orbitCenter.dataset.position;
    }
    
    // Get base radius/phi from current view or fallback to default zoom. 
    // Initial azimuthal angle stays at -45deg, tilt adjusted down to 50deg (isometric view)
    // Distance pushed back by 75% explicitly relative to the 45m distance (now 78.75m ~ 79m)
    modelViewer.cameraOrbit = `-45deg 50deg 79m`;

    const orbitLoop = () => {
      if (!isOrbiting) return;
      currentTheta -= 0.003; // ~0.17 degrees per frame, very slow radians (made negative to match starting sign)
      
      // Update theta continuously, keep tilt at 50deg and distance at 79m
      modelViewer.cameraOrbit = `calc(-45deg + ${currentTheta}rad) 50deg 79m`;
      
      orbitRaf = requestAnimationFrame(orbitLoop);
    };
    
    orbitLoop();
  };

  const stopIdleOrbit = () => {
    if (isOrbiting) {
      isOrbiting = false;
      cancelAnimationFrame(orbitRaf);
    }
  };

  // Wait for the model to finish its initial load before starting orbit and revealing UI
  modelViewer.addEventListener('load', () => {
    // Reveal the legend panel cleanly
    legendPanel.classList.remove('loading-hidden');
    
    // Start the idle orbit
    startIdleOrbit();
  });

  // Interrupt orbit immediately on ANY interaction.
  ['pointerdown', 'touchstart', 'wheel', 'keydown', 'mousedown'].forEach(event => {
    modelViewer.addEventListener(event, stopIdleOrbit, { passive: true });
  });

  // Ensure interface touches also stop it.
  legendPanel.addEventListener('mousedown', stopIdleOrbit);
  legendPanel.addEventListener('touchstart', stopIdleOrbit, { passive: true });


  // --- Depth-based Fading ---
  modelViewer.addEventListener('camera-change', () => {
    hotspots.forEach(h => {
      // Get the dot product between the hotspot normal and internal camera angle
      if (h.dataset.normal) {
        // model-viewer calculates visibility via dot product behind the scenes to control the underlying elements
        // The custom CSS controls this through angled-away class
        
        // This takes advantage of the native 'data-visibility-attribute' mechanism model-viewer uses
        // But the user requested a specific class logic
        // Because data-visibility-attribute handles strict visibility, we will attach an overlay-driven class

        const normal = h.dataset.normal.split(' ').map(parseFloat);
        // We use model-viewer's built-in position calculation to determine real camera alignment since its exact projection matrix isn't trivially exposed without its api 
        // A simple heuristic using the built in position logic:
      }
    });
  });

  // the easiest method to handle the fading natively on model viewer is looking at the 'data-visible'
  // model viewer sets 'data-visible' to true or false.

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-visible') {
        const h = mutation.target;
        // modelViewer natively sets data-visible=false when strongly pointing away
        // However, instead of hiding entirely we modify its style according to requirements
        if(h.dataset.visible === 'false' || h.dataset.visible === false || !h.hasAttribute('data-visible')){
           h.classList.add('angled-away');
        } else {
           h.classList.remove('angled-away');
        }
      }
    });
  });

  hotspots.forEach(h => {
    // Override the native hide behaviour:
    // Model-viewer naturally sets opacity to 0 via their default rules in CSS or JS. 
    // We handle it via CSS overriding and the MutationObserver monitoring the data tag.
    
    // Inject a <style> tag if not already injected that forces model-viewer to not hide the buttons completely when 'data-visible' is false.
    observer.observe(h, { attributes: true });
  });
  
  // Model viewer naturally hides buttons that aren't visible with a built-in style. 
  // We need to override this behavior so our CSS opacity transition works.
  const style = document.createElement('style');
  style.textContent = `
    .Hotspot:not([data-visible]) {
      display: inline-flex !important;
      visibility: visible !important;
    }
    
    .Hotspot:not([data-visible]) > * {
      opacity: 1 !important;
      pointer-events: auto !important;
      transform: none !important;
    }
  `;
  document.head.appendChild(style);

});