from setuptools import setup, find_packages

setup(
    name='hierarchical-digital-twin',
    version='0.1.0',
    author='Your Name',
    author_email='truongng201@example.com',
    description='A project for simulating a hierarchical digital twin system with central and edge nodes.',
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    install_requires=[
        'networkx',
        'matplotlib',
        'numpy',
    ],
    classifiers=[
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.6',
)