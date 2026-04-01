from django import forms

from .models import SystemSettings


class SystemSettingsForm(forms.ModelForm):
    class Meta:
        model = SystemSettings
        fields = [
            'default_language',
            'vat_rate',
            'theatre_legal_name',
            'theatre_rc',
            'theatre_ice',
            'theatre_if',
            'contact_email',
            'legal_footer_text',
        ]
        widgets = {
            'legal_footer_text': forms.Textarea(attrs={'rows': 4}),
        }
