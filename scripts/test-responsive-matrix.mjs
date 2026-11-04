import { chromium } from "playwright";

const VIEWPORTS = [
  { name: "mobile-small-320", width: 320, height: 568 },
  { name: "mobile-classic-375", width: 375, height: 667 },
  { name: "mobile-modern-390", width: 390, height: 844 },
  { name: "mobile-max-430", width: 430, height: 932 },
  { name: "tablet-portrait-768", width: 768, height: 1024 },
  { name: "tablet-landscape-1024", width: 1024, height: 768 },
  { name: "laptop-hd-1280", width: 1280, height: 720 },
  { name: "laptop-1366", width: 1366, height: 768 },
  { name: "desktop-fhd-1920", width: 1920, height: 1080 },
];

async function runResponsiveTests() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  console.log("=== INICIANDO MATRIZ DE PRUEBAS RESPONSIVE ===");

  const results = [];

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    
    // Login
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.fill('input[placeholder="12345678"]', "90000005");
    await page.fill('input[placeholder="••••••••"]', "90000005");
    await page.click('button:has-text("Ingresar")');
    await page.waitForTimeout(3000);

    // Navegar a /eventos/gestion
    await page.goto("http://localhost:3000/eventos/gestion", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // 1. Verificar vista principal antes de abrir modal
    const mainViewCheck = await page.evaluate(() => {
      return {
        bodyScrollWidth: document.body.scrollWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });

    // Abrir modal
    const openBtn = page.getByRole("button", { name: "+ Nuevo curso / actividad" });
    await openBtn.click();
    await page.waitForTimeout(600);

    // Evaluar cada paso del wizard (Pasos 1 a 6)
    const stepChecks = [];
    for (let step = 1; step <= 6; step++) {
      if (step > 1) {
        // En paso 1, llenar título obligatorio para poder avanzar
        if (step === 2) {
          const titleInput = page.locator('input[placeholder="ej. Especialización en Arquitectura Cloud & DevOps"]');
          await titleInput.fill("Curso de Prueba Responsiva 2026");
        }
        const nextBtn = page.locator('#course-wizard-footer button:has-text("Siguiente")');
        await nextBtn.click();
        await page.waitForTimeout(350);
      }

      const stepMetrics = await page.evaluate((stepNum) => {
        const modal = document.querySelector("#course-wizard-modal");
        const footer = document.querySelector("#course-wizard-footer");
        const cancelBtn = footer?.querySelector("button:first-child");
        const prevBtn = footer ? Array.from(footer.querySelectorAll("button")).find(b => b.textContent?.includes("Anterior")) : null;
        const nextOrSubmitBtn = footer ? Array.from(footer.querySelectorAll("button")).find(b => b.textContent?.includes("Siguiente") || b.textContent?.includes("Crear actividad")) : null;

        const modalRect = modal?.getBoundingClientRect();
        const footerRect = footer?.getBoundingClientRect();
        const cancelRect = cancelBtn?.getBoundingClientRect();
        const prevRect = prevBtn?.getBoundingClientRect();
        const nextRect = nextOrSubmitBtn?.getBoundingClientRect();

        const hasHorizontalOverflow = modal ? modal.scrollWidth > modal.clientWidth + 1 : false;
        const isModalClipped = modalRect ? (modalRect.bottom > window.innerHeight || modalRect.top < 0) : false;
        const isFooterClipped = footerRect ? (footerRect.bottom > window.innerHeight) : false;

        // Comprobar si los botones se solapan o desbordan del footer
        let buttonsOverflowFooter = false;
        if (cancelRect && footerRect && (cancelRect.left < footerRect.left || cancelRect.right > footerRect.right)) buttonsOverflowFooter = true;
        if (prevRect && footerRect && (prevRect.left < footerRect.left || prevRect.right > footerRect.right)) buttonsOverflowFooter = true;
        if (nextRect && footerRect && (nextRect.left < footerRect.left || nextRect.right > footerRect.right)) buttonsOverflowFooter = true;

        return {
          stepNum,
          hasHorizontalOverflow,
          isModalClipped,
          isFooterClipped,
          buttonsOverflowFooter,
          modalWidth: modalRect?.width,
          modalHeight: modalRect?.height,
          footerHeight: footerRect?.height,
          cancelBtnWidth: cancelRect?.width,
          prevBtnWidth: prevRect?.width,
          nextBtnWidth: nextRect?.width,
        };
      }, step);

      stepChecks.push(stepMetrics);
    }

    // Tomar screenshot de Paso 2 (donde están Anterior y Siguiente)
    // Ir a Paso 2 haciendo clic en stepper
    const step2Pill = page.locator('#course-wizard-modal button:has-text("02")').first();
    await step2Pill.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `screenshots-eventos-scroll/responsive-${vp.name}-step2.png` });

    results.push({
      viewport: vp,
      mainView: mainViewCheck,
      stepChecks,
    });

    console.log(`✓ Verificado ${vp.name} (${vp.width}x${vp.height}) - Desborde horizontal main: ${mainViewCheck.hasHorizontalOverflow}`);
    await page.close();
  }

  await browser.close();
  console.log("\n=== RESUMEN DE LA MATRIZ RESPONSIVE ===");
  console.log(JSON.stringify(results, null, 2));
}

runResponsiveTests().catch(console.error);

