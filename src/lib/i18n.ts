import { EventType, Language } from "@/lib/types";

export const copy = {
  fr: {
    appName: "Orvia Invitations",
    heroTitle: "Créez des invitations élégantes, générées par l'IA.",
    heroBody:
      "Concevez des pages d'invitation multilingues pour vos événements en quelques minutes, puis personnalisez chaque détail visuel avant publication.",
    startLabel: "Paramètres de départ",
    eventType: "Type d'événement",
    language: "Langue",
    generic: "Générique",
    wedding: "Mariage",
    birthday: "Anniversaire",
    baptism: "Baptême",
    corporate: "Professionnel",
    details: "Informations de l'événement",
    title: "Titre",
    hostName: "Hôte / organisateur",
    description: "Description",
    dateTime: "Date et heure",
    venue: "Lieu",
    dressCode: "Dress code",
    contactInfo: "Contact",
    heroImage: "Image de couverture",
    theme: "Ambiance",
    prompt: "Prompt créatif",
    generate: "Générer l'invitation",
    regenerate: "Relancer la génération",
    editor: "Éditeur visuel",
    preview: "Aperçu en direct",
    publish: "Publier",
    saveDraft: "Enregistrer les changements",
    saving: "Enregistrement...",
    publishing: "Publication...",
    published: "Invitation publiée",
    draft: "Brouillon",
    publicLink: "Lien public",
    copyLink: "Copier le lien",
    blocks: "Blocs",
    colors: "Couleurs",
    typography: "Typographies",
    layout: "Mise en page",
    noPreview:
      "La prévisualisation apparaîtra ici après la génération. Vous pourrez ensuite ajuster le texte, les couleurs et la structure.",
    aiError:
      "La génération a échoué. Vérifie les champs principaux ou relance avec un prompt plus précis.",
    publishHint:
      "La page n'est accessible qu'après publication manuelle.",
    notFound: "Invitation introuvable",
    notPublished: "Cette invitation n'est pas encore publique.",
    backHome: "Retour à l'atelier",
    publishReady: "Préparez le brouillon, puis rendez-le public quand tout est prêt.",
    scenariosTitle: "Cas de lancement couverts",
    weddingScenario: "Mariage romantique",
    birthdayScenario: "Anniversaire festif",
    corporateScenario: "Événement professionnel soigné"
  },
  en: {
    appName: "Orvia Invitations",
    heroTitle: "Create elegant invitations generated with AI.",
    heroBody:
      "Design multilingual invitation pages for your events in minutes, then refine every visual detail before publishing.",
    startLabel: "Starting settings",
    eventType: "Event type",
    language: "Language",
    generic: "Generic",
    wedding: "Wedding",
    birthday: "Birthday",
    baptism: "Baptism",
    corporate: "Corporate",
    details: "Event details",
    title: "Title",
    hostName: "Host / organizer",
    description: "Description",
    dateTime: "Date and time",
    venue: "Venue",
    dressCode: "Dress code",
    contactInfo: "Contact",
    heroImage: "Hero image",
    theme: "Theme",
    prompt: "Creative prompt",
    generate: "Generate invitation",
    regenerate: "Regenerate",
    editor: "Visual editor",
    preview: "Live preview",
    publish: "Publish",
    saveDraft: "Save changes",
    saving: "Saving...",
    publishing: "Publishing...",
    published: "Invitation published",
    draft: "Draft",
    publicLink: "Public link",
    copyLink: "Copy link",
    blocks: "Blocks",
    colors: "Colors",
    typography: "Typography",
    layout: "Layout",
    noPreview:
      "The preview will appear here after generation. You can then refine text, colors, and structure.",
    aiError:
      "Generation failed. Check the main fields or retry with a more specific prompt.",
    publishHint: "The page stays private until you publish it manually.",
    notFound: "Invitation not found",
    notPublished: "This invitation is not public yet.",
    backHome: "Back to studio",
    publishReady: "Polish the draft first, then make it public when it is ready.",
    scenariosTitle: "Launch scenarios covered",
    weddingScenario: "Romantic wedding",
    birthdayScenario: "Playful birthday",
    corporateScenario: "Polished corporate event"
  }
} as const;

export function getCopy(language: Language) {
  return copy[language];
}

export function getEventTypeOptions(language: Language) {
  const t = getCopy(language);

  return [
    { value: "generic", label: t.generic },
    { value: "wedding", label: t.wedding },
    { value: "birthday", label: t.birthday },
    { value: "baptism", label: t.baptism },
    { value: "corporate", label: t.corporate }
  ] as Array<{ value: EventType; label: string }>;
}
