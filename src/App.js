import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { Search, BookOpen } from "lucide-react";
import "./styles.css";

const sources = [
  { id: "modeleFR", label: "Modèle (FR)", col: 1, sourceCol: 0 },
  { id: "modeleEN", label: "Modèle (EN)", col: 3, sourceCol: 0 },
  { id: "directiveFR", label: "Directive (FR)", col: 6, sourceCol: 5 },
  { id: "directiveEN", label: "Directive (EN)", col: 8, sourceCol: 5 },
  { id: "cgi", label: "CGI", col: 11, sourceCol: 10 },
];

// Fonction utilitaire pour formater la source
const formatSource = (source, sourceType) => {
  if (!source) return "";

  if (source.match(/^\d/)) {
    switch (sourceType) {
      case "modeleFR":
      case "modeleEN":
        return `Modèle de règles, art. ${source}`;
      case "directiveFR":
      case "directiveEN":
        return `Dir. GloBE, art. ${source}`;
      case "cgi":
        return `CGI, art. ${source}`;
      default:
        return source;
    }
  }
  return source;
};

// Fonction pour formater une définition en HTML
const formatDefinition = (text) => {
  if (!text) return { __html: "" };

  // Convertir les retours à la ligne en sauts de paragraphe
  let formattedText = text
    // Traiter les listes
    .split("\n")
    .map((line) => {
      // Détecter les éléments de liste avec lettres (a), b), etc.)
      if (line.match(/^[a-z]\)/)) {
        return `<li class="ml-4 mb-2">${line.replace(/^[a-z]\)\s*/, "")}</li>`;
      }
      // Détecter les éléments de liste avec chiffres (1), 2), etc.)
      if (line.match(/^[0-9]+\)/)) {
        return `<li class="ml-4 mb-2">${line.replace(/^[0-9]+\)\s*/, "")}</li>`;
      }
      // Détecter les sous-listes (i), ii), etc.)
      if (line.match(/^[ivx]+\)/)) {
        return `<li class="ml-8 mb-2">${line.replace(/^[ivx]+\)\s*/, "")}</li>`;
      }
      // Ligne normale
      return `<div class="mb-2">${line}</div>`;
    })
    .join("");

  // Entourer les listes de ul
  formattedText = formattedText
    .replace(/<li/g, '<ul class="list-disc mb-4"><li')
    .replace(/<\/li>\s*(?!<li|<ul)/g, "</li></ul>");

  return { __html: formattedText };
};

const GlobeLexicon = () => {
  const [terms, setTerms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState(sources[0]);
  const [compareSource, setCompareSource] = useState(sources[1]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger le fichier CSV depuis le dossier public
        const response = await fetch("/globeLexicon.csv");
        const text = await response.text();

        Papa.parse(text, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data.slice(3);
            const processedData = data
              .map((row) => ({
                modeleFR: {
                  term: row[1],
                  def: row[2],
                  source: row[0],
                },
                modeleEN: {
                  term: row[3],
                  def: row[4],
                  source: row[0],
                },
                directiveFR: {
                  term: row[6],
                  def: row[7],
                  source: row[5],
                },
                directiveEN: {
                  term: row[8],
                  def: row[9],
                  source: row[5],
                },
                cgi: {
                  term: row[11],
                  def: row[12],
                  source: row[10],
                },
              }))
              .filter(
                (term) =>
                  term.modeleFR.term ||
                  term.modeleEN.term ||
                  term.directiveFR.term ||
                  term.directiveEN.term ||
                  term.cgi.term
              );
            setTerms(processedData);
          },
        });
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  const filteredTerms = terms.filter((term) =>
    term[selectedSource.id].term
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Lexique GloBE</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2">Rechercher dans :</label>
          <select
            className="w-full mb-4 p-2 border rounded"
            value={selectedSource.id}
            onChange={(e) => {
              const newSource = sources.find((s) => s.id === e.target.value);
              setSelectedSource(newSource);
              if (compareSource.id === newSource.id) {
                setCompareSource(sources.find((s) => s.id !== newSource.id));
              }
            }}
          >
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.label}
              </option>
            ))}
          </select>

          <div className="search-container">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="search-input pl-10"
                placeholder="Rechercher un terme..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
              />
            </div>

            {isDropdownOpen && (
              <div className="dropdown-list">
                {filteredTerms.map((term, index) => (
                  <div
                    key={index}
                    className={`dropdown-item ${
                      selectedTerm === term ? "selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedTerm(term);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {term[selectedSource.id].term}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedTerm && (
          <div className="definition-card">
            <h2 className="section-title">Termes équivalents</h2>
            <div className="equivalent-terms">
              {sources
                .filter((s) => s.id !== selectedSource.id)
                .map(
                  (source) =>
                    selectedTerm[source.id]?.term && (
                      <div key={source.id} className="equivalent-term">
                        <span className="font-medium text-gray-700">
                          {source.label}:
                        </span>
                        <span className="ml-2">
                          {selectedTerm[source.id].term}
                        </span>
                      </div>
                    )
                )}
            </div>

            {/* Première définition */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="section-title">{selectedSource.label}</h3>
                {selectedTerm[selectedSource.id].source && (
                  <span className="source-tag">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {formatSource(
                      selectedTerm[selectedSource.id].source,
                      selectedSource.id
                    )}
                  </span>
                )}
              </div>
              <div
                className="definition-content"
                dangerouslySetInnerHTML={formatDefinition(
                  selectedTerm[selectedSource.id].def
                )}
              />
            </div>

            {/* Section de comparaison */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="section-title">Comparer avec :</h3>
                  <select
                    className="p-2 border rounded"
                    value={compareSource.id}
                    onChange={(e) =>
                      setCompareSource(
                        sources.find((s) => s.id === e.target.value)
                      )
                    }
                  >
                    {sources
                      .filter((s) => s.id !== selectedSource.id)
                      .map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.label}
                        </option>
                      ))}
                  </select>
                </div>
                {selectedTerm[compareSource.id].source && (
                  <span className="source-tag">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {formatSource(
                      selectedTerm[compareSource.id].source,
                      compareSource.id
                    )}
                  </span>
                )}
              </div>
              <div
                className="definition-content"
                dangerouslySetInnerHTML={formatDefinition(
                  selectedTerm[compareSource.id].def
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobeLexicon;
