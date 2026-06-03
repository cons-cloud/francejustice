import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../../test/utils';
import { VoiceAssistant } from '../../components/ui/VoiceAssistant';

// Mock speech synthesis to prevent errors during tests
if (typeof window !== 'undefined') {
  (window as any).speechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
  };
}

describe('VoiceAssistant Component', () => {
  const mockOnAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the floating voice trigger button initially', () => {
    render(
      <VoiceAssistant
        mode="citizen"
        activeTab="overview"
        onAction={mockOnAction}
      />
    );

    // Floating activation button should be present
    const triggerBtn = screen.getByTitle("Ouvrir l'assistant juridique vocal");
    expect(triggerBtn).toBeInTheDocument();
    expect(screen.getByText('IA Vocale')).toBeInTheDocument();
  });

  it('opens the premium glassmorphism panel when clicked', async () => {
    render(
      <VoiceAssistant
        mode="citizen"
        activeTab="overview"
        onAction={mockOnAction}
      />
    );

    const triggerBtn = screen.getByTitle("Ouvrir l'assistant juridique vocal");
    
    await act(async () => {
      fireEvent.click(triggerBtn);
    });

    // Panel title and informative welcome text should be visible
    expect(screen.getByText('IA Vocale Law Just')).toBeInTheDocument();
    expect(screen.getByText(/Bonjour ! Je suis votre assistant juridique vocal/)).toBeInTheDocument();
    expect(screen.getByText('"Va sur l\'onglet rendez-vous"')).toBeInTheDocument();
  });

  it('allows manual textual query submission as keyboard fallback', async () => {
    render(
      <VoiceAssistant
        mode="citizen"
        activeTab="overview"
        onAction={mockOnAction}
      />
    );

    const triggerBtn = screen.getByTitle("Ouvrir l'assistant juridique vocal");
    await act(async () => {
      fireEvent.click(triggerBtn);
    });

    // Find input and submit form
    const input = screen.getByPlaceholderText('Écrivez ou posez votre question juridique ici...');
    expect(input).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(input, { target: { value: "Qu'est ce que l'article 1240 du Code Civil ?" } });
    });

    const submitBtn = screen.getByText('Envoyer');
    expect(submitBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Transcript should be displayed in the conversation thread
    expect(screen.getByText("Qu'est ce que l'article 1240 du Code Civil ?")).toBeInTheDocument();
  });
});
