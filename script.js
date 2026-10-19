const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
let trilhaFundo = document.getElementById('musicaFundo');
if (trilhaFundo && trilhaFundo.tagName !== 'AUDIO') {
  trilhaFundo = trilhaFundo.querySelector('audio') || document.querySelector('audio');
}

const modalBoasVindas = document.getElementById("dialog-boas-vindas");
const botaoFecharBoasVindas = document.getElementById("fechar-boas-vindas");

function ligarMusica() {
  if (!trilhaFundo) return;
  
  trilhaFundo.volume = 0.6;
  trilhaFundo.play()
    .then(() => {
      console.log("Música iniciada com sucesso!");
      removerGatilhos();
    })
    .catch((error) => {
      // Se ainda assim o navegador chiar, ele tenta no próximo clique
      console.log("Aguardando clique definitivo do usuário.");
    });
}

function removerGatilhos() {
  document.removeEventListener('click', ligarMusica);
  document.removeEventListener('touchend', ligarMusica); // touchend funciona melhor que touchstart no mobile
  document.removeEventListener('keydown', ligarMusica);
}

// Com "reduzir movimento" ligado no sistema, usa só um fade suave (sem deslizar/escalar)
function frames(type) {
  const reduce = reduceMotion.matches;
  if (type === "in") {
    return reduce
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [
          { opacity: 0, transform: "translateY(24px) scale(0.96)" },
          { opacity: 1, transform: "none" },
        ];
  }
  return reduce
    ? [{ opacity: 1 }, { opacity: 0 }]
    : [
        { opacity: 1, transform: "none" },
        { opacity: 0, transform: "translateY(12px) scale(0.97)" },
      ];
}

// Anima o elemento (ou o ::backdrop dele)
function play(el, keyframes, options, pseudoElement) {
  try {
    return el.animate(
      keyframes,
      pseudoElement ? { ...options, pseudoElement } : options,
    );
  } catch {
    return null;
  }
}

function openDialog(dialog) {
  dialog.showModal();
  play(dialog, frames("in"), { duration: 350, easing: EASE_OUT });
  play(dialog, [{ opacity: 0 }, { opacity: 1 }], { duration: 350 }, "::backdrop");
}

function closeDialog(dialog) {
  if (!dialog.open || dialog.dataset.closing) return;
  dialog.dataset.closing = "true";

  const box = play(dialog, frames("out"), {
    duration: 220,
    easing: "ease",
    fill: "forwards",
  });
  play(
    dialog,
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: 220, fill: "forwards" },
    "::backdrop",
  );

  const finish = () => {
    delete dialog.dataset.closing;

    dialog.getAnimations({ subtree: true })
      .forEach((animation) => animation.cancel());

    dialog.close();

    // A música começa somente depois de fechar o modal inicial.
    if (dialog.id === "dialog-boas-vindas") {
      ligarMusica();
    }
  };

  if (box) box.finished.then(finish, finish);
  else finish();
}

// Abre os modais (confirmação de presença e traje)
document.querySelectorAll("[data-open-dialog]").forEach((button) => {
  const dialog = document.getElementById(button.dataset.openDialog);
  if (!dialog) return;
  button.addEventListener("click", () => openDialog(dialog));
});

document.querySelectorAll("dialog").forEach((dialog) => {
  // Clique fora da janela
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });

  // Tecla Esc
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog(dialog);
  });

  // Botões de fechar (<form method="dialog">)
  dialog.querySelectorAll('form[method="dialog"]').forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      closeDialog(dialog);
    });
  });
});

if (modalBoasVindas && botaoFecharBoasVindas) {
  // Impede que o modal inicial seja fechado por outros meios.
  modalBoasVindas.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog(modalBoasVindas);
  });

  modalBoasVindas.addEventListener("click", (event) => {
    if (event.target === modalBoasVindas) {
      closeDialog(modalBoasVindas);
    }
  });

  botaoFecharBoasVindas.addEventListener("click", () => {
    closeDialog(modalBoasVindas);
  });

  // O convite já abre com o modal visível.
  openDialog(modalBoasVindas);
}