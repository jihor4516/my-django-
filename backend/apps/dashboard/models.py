from django.db import models
from django.utils.translation import gettext_lazy as _


class SystemSettings(models.Model):
	default_language = models.CharField(
		max_length=8,
		choices=[('ar', 'AR'), ('fr', 'FR'), ('en', 'EN')],
		default='ar',
	)
	vat_rate = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
	theatre_legal_name = models.CharField(max_length=255, default='Grand Theatre of Rabat')
	theatre_rc = models.CharField(max_length=64, blank=True)
	theatre_ice = models.CharField(max_length=64, blank=True)
	theatre_if = models.CharField(max_length=64, blank=True)
	contact_email = models.EmailField(blank=True)
	legal_footer_text = models.TextField(blank=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		verbose_name = _('System Settings')
		verbose_name_plural = _('System Settings')

	def __str__(self) -> str:
		return self.theatre_legal_name

	@classmethod
	def get_solo(cls):
		settings_obj, _ = cls.objects.get_or_create(pk=1)
		return settings_obj
