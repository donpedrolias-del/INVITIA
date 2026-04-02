import { EventType, Language } from "@/lib/types";

export const copy = {
  fr: {
    appName: "INVITIA",
    heroTitle: "Des invitations premium qui donnent envie d'etre partagees.",
    heroBody:
      "INVITIA transforme vos idees en invitations elegantes, modernes et prêtes à publier, avec une direction visuelle plus haut de gamme et un rendu pensé pour marquer les invites dès le premier regard.",
    startLabel: "Atelier de création",
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
    colors: "Palette",
    typography: "Typographies",
    layout: "Mise en page",
    noPreview:
      "L'aperçu premium apparaîtra ici après la génération. Vous pourrez ensuite ajuster le texte, les couleurs, l'image et la structure.",
    aiError:
      "La génération a échoué. Vérifie les champs principaux ou relance avec un prompt plus précis.",
    publishHint:
      "La page n'est accessible qu'après publication manuelle.",
    notFound: "Invitation introuvable",
    notPublished: "Cette invitation n'est pas encore publique.",
    backHome: "Retour à l'atelier",
    publishReady: "Préparez le brouillon, peaufinez le rendu, puis rendez-le public quand tout est prêt.",
    scenariosTitle: "Collections de départ",
    weddingScenario: "Mariage romantique",
    birthdayScenario: "Anniversaire festif",
    corporateScenario: "Événement professionnel soigné"
  },
  en: {
    appName: "INVITIA",
    heroTitle: "Premium invitations designed to feel instantly shareable.",
    heroBody:
      "INVITIA turns your ideas into elegant, modern invitation pages with a stronger art direction and a polished visual finish built to impress guests at first glance.",
    startLabel: "Creation studio",
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
    heroImage: "Cover image",
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
    colors: "Palette",
    typography: "Typography",
    layout: "Layout",
    noPreview:
      "Your premium preview will appear here after generation. You can then refine text, colors, imagery, and structure.",
    aiError:
      "Generation failed. Check the main fields or retry with a more specific prompt.",
    publishHint: "The page stays private until you publish it manually.",
    notFound: "Invitation not found",
    notPublished: "This invitation is not public yet.",
    backHome: "Back to studio",
    publishReady: "Polish the draft, refine the look, then make it public when it feels ready.",
    scenariosTitle: "Launch collections",
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
