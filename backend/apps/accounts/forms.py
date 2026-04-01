from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.core.exceptions import ValidationError
from .models import UserProfile

class SignUpForm(UserCreationForm):
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=100, required=True)
    last_name = forms.CharField(max_length=100, required=True)

    # UserProfile Fields
    user_type = forms.ChoiceField(choices=UserProfile.USER_TYPES, widget=forms.HiddenInput())
    phone = forms.CharField(max_length=20, required=True)
    address = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}), required=True)
    city = forms.CharField(max_length=100, required=True)
    
    # Conditional Fields (will be validated based on user_type)
    cin = forms.CharField(max_length=20, required=False)
    company_name = forms.CharField(max_length=200, required=False)
    rc_number = forms.CharField(max_length=50, required=False)
    ice_number = forms.CharField(max_length=15, required=False)
    association_name = forms.CharField(max_length=200, required=False)
    association_license = forms.CharField(max_length=50, required=False)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name')

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email__iexact=email).exists():
            raise ValidationError('This email is already registered / هذا البريد مسجل مسبقاً')
        return email

    def clean(self):
        cleaned_data = super().clean()
        user_type = cleaned_data.get('user_type')
        
        if user_type == 'individual':
            if not cleaned_data.get('cin'):
                self.add_error('cin', 'CIN is required for individuals')
        
        elif user_type == 'company':
            if not cleaned_data.get('company_name'):
                self.add_error('company_name', 'Company Name is required')
            if not cleaned_data.get('rc_number'):
                self.add_error('rc_number', 'RC Number is required')
            if not cleaned_data.get('ice_number'):
                self.add_error('ice_number', 'ICE Number is required')
        
        elif user_type == 'association':
            if not cleaned_data.get('association_name'):
                self.add_error('association_name', 'Association Name is required')
            if not cleaned_data.get('association_license'):
                self.add_error('association_license', 'License Number is required')
        
        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        if commit:
            user.save()
            # Create UserProfile
            profile = UserProfile(
                user=user,
                user_type=self.cleaned_data['user_type'],
                phone=self.cleaned_data['phone'],
                address=self.cleaned_data['address'],
                city=self.cleaned_data['city'],
                cin=self.cleaned_data.get('cin', ''),
                company_name=self.cleaned_data.get('company_name', ''),
                rc_number=self.cleaned_data.get('rc_number', ''),
                ice_number=self.cleaned_data.get('ice_number', ''),
                association_name=self.cleaned_data.get('association_name', ''),
                association_license=self.cleaned_data.get('association_license', ''),
            )
            profile.save()
        return user

class LoginForm(AuthenticationForm):
    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)
