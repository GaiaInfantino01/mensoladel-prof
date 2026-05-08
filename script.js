const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQwD-BejuTnjtnrQjm8nq45yUMnPlpqdVCNtN966RAOOQdRhDyBCJMcfjaHdBJDV2UmKNcCt_goyH5S/pub?output=csv";

const recommendedList =
  document.getElementById("recommended-list");

let books = [];

function clean(value, fallback = "Non indicato") {
  const text = value ? String(value).trim() : "";
  return text || fallback;
}

function normalize(value) {
  return clean(value, "").toLowerCase();
}

function getField(book, ...names) {
  for (const name of names) {
    if (
      book[name] !== undefined &&
      book[name] !== null &&
      String(book[name]).trim() !== ""
    ) {
      return book[name];
    }
  }

  return "";
}

function getTitle(book) {
  return getField(book, "TITOLO", "Titolo", "titolo");
}

function getAuthor(book) {
  return getField(book, "AUTORE", "Autore", "autore");
}

function getGenre(book) {
  return getField(book, "GENERE", "Genere", "genere");
}

function getIsbn(book) {
  return getField(book, "ISBN", "Isbn", "isbn");
}

function getBookCover(book) {

  let manualCover = clean(
    getField(
      book,
      "COPERTINA",
      "Copertina",
      "copertina",
      "URL COPERTINA"
    ),
    ""
  );

  if (manualCover !== "") {

    const driveMatch =
      manualCover.match(/\/d\/([^/]+)/);

    if (driveMatch && driveMatch[1]) {
      manualCover =
        `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    }

    return manualCover;
  }

  const isbn = clean(getIsbn(book), "");

  if (isbn !== "") {

    const cleanIsbn =
      isbn.replace(/[^0-9Xx]/g, "");

    return `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
  }

  return "https://placehold.co/140x210?text=No+Cover";
}

function isBookAvailable(book) {

  const disponibilita = normalize(
    getField(
      book,
      "DISPONIBILITA",
      "Disponibilita",
      "disponibilita"
    )
  );

  const quantita = Number(
    getField(
      book,
      "QUANTITA",
      "Quantita",
      "quantita"
    ) || 0
  );

  if (disponibilita.includes("non")) return false;

  if (disponibilita.includes("disponibile")) return true;

  if (quantita > 0) return true;

  return false;
}

function createBookCard(book) {

  const li = document.createElement("li");

  const available =
    isBookAvailable(book);

  const cover =
    getBookCover(book);

  li.className = "book-item";

  li.innerHTML = `
    <article>

      <div class="book-main">

        <div>

          <h3 class="book-title">
            ${clean(getTitle(book), "Titolo mancante")}
          </h3>

          <div class="book-meta">

            <p>
              <strong>Autore:</strong>
              ${clean(getAuthor(book))}
            </p>

            <p>
              <strong>Editore:</strong>
              ${clean(
                getField(
                  book,
                  "EDITORE",
                  "Editore",
                  "editore"
                )
              )}
            </p>

            <p>
              <strong>Anno:</strong>
              ${clean(
                getField(
                  book,
                  "ANNO",
                  "Anno",
                  "anno"
                )
              )}
            </p>

            <p>
              <strong>Genere:</strong>
              ${clean(getGenre(book))}
            </p>

            <p>
              <strong>ISBN:</strong>
              ${clean(getIsbn(book))}
            </p>

          </div>

          <span class="availability-badge ${available ? "available" : "unavailable"}">
            ${available ? "Disponibile" : "Non disponibile"}
          </span>

        </div>

        <div class="book-cover-box">

          <img
            class="book-cover"
            src="${cover}"
            alt="Copertina libro"

            loading="lazy"

            onerror="this.src='https://placehold.co/140x210?text=No+Cover'"
          >

        </div>

      </div>

      <details class="book-extra">

        <summary>
          Mostra dettagli
        </summary>

        <div class="book-details">

          <p>
            <strong>Quantità:</strong>
            ${clean(
              getField(
                book,
                "QUANTITA",
                "Quantita",
                "quantita"
              )
            )}
          </p>

          <p>
            <strong>Luogo:</strong>
            ${clean(
              getField(
                book,
                "LUOGO",
                "Luogo",
                "luogo"
              )
            )}
          </p>

          <p>
            <strong>Prestito:</strong>
            ${clean(
              getField(
                book,
                "PRESTITO",
                "Prestito",
                "prestito"
              )
            )}
          </p>

          <p class="abstract">

            <strong>Abstract:</strong>

            ${clean(
              getField(
                book,
                "ABSTRACT",
                "Abstract",
                "abstract"
              ),
              "Abstract non disponibile."
            )}

          </p>

        </div>

      </details>

    </article>
  `;

  return li;
}

function renderRecommendedBooks() {

  recommendedList.innerHTML = "";

  const recommendedBooks = books.filter((book) => {

    const value = normalize(
      getField(
        book,
        "CONSIGLIATO",
        "Consigliato",
        "consigliato"
      )
    );

    return (
      value === "si" ||
      value === "sì" ||
      value === "yes"
    );
  });

  if (recommendedBooks.length === 0) {

    recommendedList.innerHTML =
      `<li class="empty-message">
        Nessun libro consigliato al momento.
      </li>`;

    return;
  }

  recommendedBooks.forEach((book) => {
    recommendedList.appendChild(
      createBookCard(book)
    );
  });
}

function loadBooks() {

  recommendedList.innerHTML =
    `<li class="empty-message">
      Caricamento libri...
    </li>`;

  Papa.parse(sheetURL, {

    download: true,

    header: true,

    skipEmptyLines: true,

    complete: function(results) {

      books = results.data.filter(
        (book) =>
          clean(getTitle(book), "") !== ""
      );

      renderRecommendedBooks();
    },

    error: function(error) {

      console.error(error);

      recommendedList.innerHTML =
        `<li class="empty-message">
          Errore nel caricamento.
        </li>`;
    },
  });
}

loadBooks();
